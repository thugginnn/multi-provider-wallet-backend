import { IsNumber, IsString, IsOptional, IsObject } from 'class-validator';

export class InitiateDepositDto {
  @IsNumber()
  amount: number;

  @IsString()
  provider: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 