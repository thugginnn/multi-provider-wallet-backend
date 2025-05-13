import { IsNumber, IsString, IsOptional, IsObject } from 'class-validator';

export class InitiateWithdrawalDto {
  @IsNumber()
  amount: number;

  @IsString()
  provider: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 