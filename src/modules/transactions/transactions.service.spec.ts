import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Cache } from 'cache-manager';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionType } from './enums/transaction-type.enum';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: Repository<Transaction>;
  let walletRepository: Repository<Wallet>;
  let transactionsQueue: Queue;
  let cacheManager: Cache;

  const mockTransaction = {
    id: '1',
    amount: 100,
    currency: 'USD',
    type: TransactionType.DEPOSIT,
    status: TransactionStatus.PENDING,
    walletId: 'wallet-1',
    wallet: {
      id: 'wallet-1',
      tenant: { id: 'tenant-1' },
      user: { id: 'user-1' },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    store: {
      keys: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            merge: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockTransaction], 1]),
              getOne: jest.fn().mockResolvedValue(mockTransaction),
              getMany: jest.fn().mockResolvedValue([mockTransaction]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getQueueToken('transactions'),
          useValue: mockQueue,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    walletRepository = module.get<Repository<Wallet>>(getRepositoryToken(Wallet));
    transactionsQueue = module.get<Queue>(getQueueToken('transactions'));
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should return cached data when available', async () => {
      const cachedData = { data: [mockTransaction], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
      mockCacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.getTransactions({
        tenantId: 'tenant-1',
        userId: 'user-1',
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(transactionRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch and cache data when cache miss', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null);

      const result = await service.getTransactions({
        tenantId: 'tenant-1',
        userId: 'user-1',
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(transactionRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getTransaction', () => {
    it('should return cached transaction when available', async () => {
      mockCacheManager.get.mockResolvedValueOnce(mockTransaction);

      const result = await service.getTransaction('1', 'tenant-1', 'user-1');

      expect(result).toEqual(mockTransaction);
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(transactionRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch and cache transaction when cache miss', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null);

      const result = await service.getTransaction('1', 'tenant-1', 'user-1');

      expect(result).toEqual(mockTransaction);
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(transactionRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create transaction and invalidate cache', async () => {
      const createDto: CreateTransactionDto = {
        amount: 100,
        currency: 'USD',
        type: TransactionType.DEPOSIT,
        walletId: 'wallet-1',
      };

      jest.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction as any);
      jest.spyOn(transactionRepository, 'save').mockResolvedValue(mockTransaction as any);
      jest.spyOn(walletRepository, 'findOne').mockResolvedValue({
        id: 'wallet-1',
        tenant: { id: 'tenant-1' },
        user: { id: 'user-1' },
      } as any);
      mockCacheManager.store.keys.mockResolvedValueOnce([
        'transaction:1:tenant-1:user-1',
        'transactions:tenant-1:user-1:1:10'
      ]);

      const result = await service.create(createDto);

      console.log('mockCacheManager.del.mock.calls:', mockCacheManager.del.mock.calls);

      expect(result).toEqual(mockTransaction);
      expect(mockQueue.add).toHaveBeenCalledWith('update-status', {
        transactionId: mockTransaction.id,
        status: TransactionStatus.PENDING,
      });
      expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('should update transaction and invalidate cache', async () => {
      const updateDto: UpdateTransactionDto = {
        status: TransactionStatus.COMPLETED,
      };

      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction as any);
      jest.spyOn(transactionRepository, 'merge').mockReturnValue({ ...mockTransaction, ...updateDto } as any);
      jest.spyOn(transactionRepository, 'save').mockResolvedValue({ ...mockTransaction, ...updateDto } as any);
      mockCacheManager.store.keys.mockResolvedValueOnce([
        'transaction:1:tenant-1:user-1',
        'transactions:tenant-1:user-1:1:10'
      ]);

      const result = await service.update('1', updateDto);

      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(mockQueue.add).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledTimes(4);
    });
  });

  describe('remove', () => {
    it('should remove transaction and invalidate cache', async () => {
      jest.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction as any);
      mockCacheManager.store.keys.mockResolvedValueOnce([
        'transaction:1:tenant-1:user-1',
        'transactions:tenant-1:user-1:1:10'
      ]);

      await service.remove('1');

      expect(transactionRepository.delete).toHaveBeenCalledWith('1');
      expect(mockCacheManager.del).toHaveBeenCalledTimes(6);
    });
  });
}); 