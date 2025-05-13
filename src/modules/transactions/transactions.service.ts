import { Injectable, NotFoundException, BadRequestException, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cache } from 'cache-manager';
import { TransactionType } from './enums/transaction-type.enum';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

interface TransactionQueryParams {
  tenantId: string;
  userId: string;
  page: number;
  limit: number;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  walletId?: string;
}

@Injectable()
export class TransactionsService implements OnModuleInit {
  private readonly logger = new Logger(TransactionsService.name);
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectQueue('transactions') private readonly transactionsQueue: Queue,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache & { store: { keys: () => Promise<string[]> } },
  ) {}

  async onModuleInit() {
    // Warm up cache with recent transactions
    await this.warmUpCache();
  }

  private async warmUpCache() {
    try {
      const recentTransactions = await this.transactionRepository.find({
        order: { createdAt: 'DESC' },
        take: 100,
        relations: ['wallet', 'wallet.tenant', 'wallet.user'],
      });

      for (const transaction of recentTransactions) {
        const cacheKey = this.generateCacheKey(transaction);
        await this.cacheManager.set(cacheKey, transaction, this.CACHE_TTL);
      }

      this.logger.log('Cache warmed up with recent transactions');
    } catch (error) {
      this.logger.error('Failed to warm up cache', error);
    }
  }

  private generateCacheKey(transaction: Transaction): string {
    return `transaction:${transaction.id}:${transaction.wallet.tenant.id}:${transaction.wallet.user.id}`;
  }

  private generateStatsCacheKey(params: Omit<TransactionQueryParams, 'page' | 'limit'>): string {
    // Deterministically serialize params for cache key
    const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
    const paramString = sorted.map(([k, v]) => `${k}=${v}`).join(':');
    return `transactions:stats:${paramString}`;
  }

  async getTransactions(params: {
    tenantId: string;
    userId: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, userId, page = 1, limit = 10 } = params;
    const cacheKey = `transactions:${tenantId}:${userId}:${page}:${limit}`;

    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return cachedData;
    }

    const [transactions, total] = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.wallet', 'wallet')
      .leftJoinAndSelect('wallet.tenant', 'tenant')
      .leftJoinAndSelect('wallet.user', 'user')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('user.id = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const result = {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  async getTransactionStats(params: Omit<TransactionQueryParams, 'page' | 'limit'>) {
    const cacheKey = this.generateStatsCacheKey(params);
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return cached;
    }

    const { tenantId, userId, startDate, endDate, walletId } = params;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.wallet', 'wallet')
      .where('wallet.tenant.id = :tenantId', { tenantId })
      .andWhere('wallet.user.id = :userId', { userId });

    if (walletId) {
      queryBuilder.andWhere('transaction.wallet.id = :walletId', { walletId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const transactions = await queryBuilder.getMany();

    const stats = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      byType: {},
      byStatus: {},
      byCurrency: {},
    };

    transactions.forEach((transaction) => {
      stats.byType[transaction.type] = (stats.byType[transaction.type] || 0) + 1;
      stats.byStatus[transaction.status] = (stats.byStatus[transaction.status] || 0) + 1;

      if (!stats.byCurrency[transaction.currency]) {
        stats.byCurrency[transaction.currency] = {
          count: 0,
          total: 0,
        };
      }
      stats.byCurrency[transaction.currency].count++;
      stats.byCurrency[transaction.currency].total += Number(transaction.amount);
    });

    await this.cacheManager.set(cacheKey, stats, this.CACHE_TTL);
    return stats;
  }

  async getTransaction(id: string, tenantId: string, userId: string) {
    const cacheKey = `transaction:${id}:${tenantId}:${userId}`;
    const cachedTransaction = await this.cacheManager.get(cacheKey);
    if (cachedTransaction) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return cachedTransaction;
    }

    const transaction = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.wallet', 'wallet')
      .leftJoinAndSelect('wallet.tenant', 'tenant')
      .leftJoinAndSelect('wallet.user', 'user')
      .where('transaction.id = :id', { id })
      .andWhere('tenant.id = :tenantId', { tenantId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.cacheManager.set(cacheKey, transaction, this.CACHE_TTL);
    return transaction;
  }

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const wallet = await this.walletRepository.findOne({
      where: { id: createTransactionDto.walletId },
      relations: ['tenant', 'user'],
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const transaction = this.transactionRepository.create({
      ...createTransactionDto,
      wallet,
      status: TransactionStatus.PENDING,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Add job to update transaction status
    await this.transactionsQueue.add('update-status', {
      transactionId: savedTransaction.id,
      status: TransactionStatus.PENDING,
    });

    // Invalidate relevant caches
    const keys = await this.cacheManager.store.keys();
    const relevantKeys = keys.filter(key => 
      key.includes(`transaction:${savedTransaction.id}`) ||
      key.includes(`transactions:${wallet.tenant.id}:${wallet.user.id}`)
    );

    console.log('Relevant keys to delete:', relevantKeys);
    console.log('cacheManager.del:', this.cacheManager.del);

    await Promise.all(relevantKeys.map(key => this.cacheManager.del(key)));

    return savedTransaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['wallet', 'wallet.tenant', 'wallet.user'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    const updatedTransaction = this.transactionRepository.merge(transaction, updateTransactionDto);
    const savedTransaction = await this.transactionRepository.save(updatedTransaction);

    // Add job to update transaction status
    await this.transactionsQueue.add('update-status', {
      transactionId: savedTransaction.id,
      status: savedTransaction.status,
    });

    // Invalidate relevant caches
    const keys = await this.cacheManager.store.keys();
    const relevantKeys = keys.filter(key => 
      key.includes(`transaction:${savedTransaction.id}`) ||
      (savedTransaction.wallet && savedTransaction.wallet.tenant && savedTransaction.wallet.user && key.includes(`transactions:${savedTransaction.wallet.tenant.id}:${savedTransaction.wallet.user.id}`))
    );

    await Promise.all(relevantKeys.map(key => this.cacheManager.del(key)));

    return savedTransaction;
  }

  async remove(id: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['wallet', 'wallet.tenant', 'wallet.user'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    await this.transactionRepository.delete(id);
    
    // Invalidate relevant caches
    const keys = await this.cacheManager.store.keys();
    const relevantKeys = keys.filter(key => 
      key.includes(`transaction:${id}`) ||
      (transaction.wallet && transaction.wallet.tenant && transaction.wallet.user && key.includes(`transactions:${transaction.wallet.tenant.id}:${transaction.wallet.user.id}`))
    );

    await Promise.all(relevantKeys.map(key => this.cacheManager.del(key)));
  }

  async retryWebhook(transactionId: string, webhookUrl: string): Promise<void> {
    await this.transactionsQueue.add('retry-webhook', {
      transactionId,
      webhookUrl,
    });
  }
} 