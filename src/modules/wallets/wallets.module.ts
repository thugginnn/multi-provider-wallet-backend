import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { WebhookController } from './webhook.controller';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    ProvidersModule,
  ],
  controllers: [WalletsController, WebhookController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {} 