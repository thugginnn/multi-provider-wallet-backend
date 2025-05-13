import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { TransactionProcessor } from './processors/transaction.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Wallet]),
    BullModule.registerQueue({
      name: 'transactions',
    }),
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionProcessor],
  exports: [TransactionsService],
})
export class TransactionsModule {} 