import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionStatus } from '../transactions/entities/transaction.entity';
import { PaymentProvider } from '../providers/interfaces/payment-provider.interface';
import { TransactionType } from '../transactions/enums/transaction-type.enum';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @Inject('PAYMENT_PROVIDERS')
    private readonly paymentProviders: Map<string, PaymentProvider>,
  ) {}

  async createWallet(userId: string, tenantId: string, currency: string): Promise<Wallet> {
    const wallet = this.walletRepository.create({
      user: { id: userId },
      tenant: { id: tenantId },
      currency,
      balance: 0,
      isActive: true,
    });

    return this.walletRepository.save(wallet);
  }

  async getWallet(id: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id },
      relations: ['user', 'tenant'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getWalletsByUser(userId: string): Promise<Wallet[]> {
    return this.walletRepository.find({
      where: { user: { id: userId } },
      relations: ['tenant'],
    });
  }

  async initiateDeposit(
    walletId: string,
    amount: number,
    provider: string,
    metadata: Record<string, any>,
  ): Promise<Transaction> {
    const wallet = await this.getWallet(walletId);
    const paymentProvider = this.paymentProviders.get(provider);

    if (!paymentProvider) {
      throw new BadRequestException('Invalid payment provider');
    }

    const transaction = this.transactionRepository.create({
      amount,
      currency: wallet.currency,
      type: TransactionType.DEPOSIT,
      walletId: wallet.id,
      status: TransactionStatus.PENDING,
      metadata,
      idempotencyKey: `${walletId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    await this.transactionRepository.save(transaction);

    try {
      const response = await paymentProvider.initiatePayment(transaction);
      transaction.providerTransactionId = response.providerTransactionId;
      transaction.metadata = {
        ...transaction.metadata,
        ...response.metadata,
      };
      await this.transactionRepository.save(transaction);
      return transaction;
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.error = {
        code: 'PROVIDER_ERROR',
        message: error.message,
      };
      await this.transactionRepository.save(transaction);
      throw error;
    }
  }

  async initiateWithdrawal(
    walletId: string,
    amount: number,
    provider: string,
    metadata: Record<string, any>,
  ): Promise<Transaction> {
    const wallet = await this.getWallet(walletId);

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    const paymentProvider = this.paymentProviders.get(provider);
    if (!paymentProvider) {
      throw new BadRequestException('Invalid payment provider');
    }

    const transaction = this.transactionRepository.create({
      amount,
      currency: wallet.currency,
      type: TransactionType.WITHDRAWAL,
      walletId: wallet.id,
      status: TransactionStatus.PENDING,
      metadata,
      idempotencyKey: `${walletId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    await this.transactionRepository.save(transaction);

    try {
      const response = await paymentProvider.initiatePayment(transaction);
      transaction.providerTransactionId = response.providerTransactionId;
      transaction.metadata = {
        ...transaction.metadata,
        ...response.metadata,
      };
      await this.transactionRepository.save(transaction);
      return transaction;
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.error = {
        code: 'PROVIDER_ERROR',
        message: error.message,
      };
      await this.transactionRepository.save(transaction);
      throw error;
    }
  }

  async transfer(
    sourceWalletId: string,
    destinationWalletId: string,
    amount: number,
    metadata: Record<string, any>,
  ): Promise<Transaction> {
    const sourceWallet = await this.getWallet(sourceWalletId);
    const destinationWallet = await this.getWallet(destinationWalletId);

    if (sourceWallet.balance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    if (sourceWallet.currency !== destinationWallet.currency) {
      throw new BadRequestException('Currency mismatch');
    }

    const transaction = this.transactionRepository.create({
      amount,
      currency: sourceWallet.currency,
      type: TransactionType.TRANSFER,
      walletId: sourceWallet.id,
      destinationWallet,
      status: TransactionStatus.PENDING,
      metadata,
      idempotencyKey: `${sourceWalletId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    });

    await this.transactionRepository.save(transaction);

    try {
      // Update balances
      sourceWallet.balance -= amount;
      destinationWallet.balance += amount;

      await this.walletRepository.save([sourceWallet, destinationWallet]);

      transaction.status = TransactionStatus.COMPLETED;
      await this.transactionRepository.save(transaction);

      return transaction;
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.error = {
        code: 'TRANSFER_ERROR',
        message: error.message,
      };
      await this.transactionRepository.save(transaction);
      throw error;
    }
  }

  async processWebhook(
    provider: string,
    payload: any,
    signature: string,
  ): Promise<Transaction> {
    const paymentProvider = this.paymentProviders.get(provider);
    if (!paymentProvider) {
      throw new BadRequestException('Invalid payment provider');
    }

    const { transaction, status } = await paymentProvider.processWebhook(payload, signature);
    const existingTransaction = await this.transactionRepository.findOne({
      where: { id: transaction.id },
      relations: ['wallet', 'destinationWallet'],
    });

    if (!existingTransaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (status === 'success') {
      if (existingTransaction.type === TransactionType.DEPOSIT) {
        existingTransaction.wallet.balance += existingTransaction.amount;
        await this.walletRepository.save(existingTransaction.wallet);
      } else if (existingTransaction.type === TransactionType.WITHDRAWAL) {
        existingTransaction.wallet.balance -= existingTransaction.amount;
        await this.walletRepository.save(existingTransaction.wallet);
      }
    }

    existingTransaction.status = transaction.status;
    existingTransaction.error = transaction.error;
    await this.transactionRepository.save(existingTransaction);

    return existingTransaction;
  }
} 