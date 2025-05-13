import { IsNumber, IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class TransferDto {
  @IsUUID()
  destinationWalletId: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 