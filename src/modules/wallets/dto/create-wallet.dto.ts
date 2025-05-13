import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  currency: string;
} 