import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNotEmpty()
  @IsUUID()
  walletId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
} 