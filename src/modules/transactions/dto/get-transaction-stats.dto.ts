import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GetTransactionStatsDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  walletId?: string;
} 