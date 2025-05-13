import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  settings?: Record<string, any>;
} 