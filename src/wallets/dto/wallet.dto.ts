import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsNumber()
  @IsOptional()
  @Min(0)
  balance?: number = 0;
}

export class FundWalletDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  fromWalletId: string;

  @IsString()
  @IsNotEmpty()
  toWalletId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsString()
  @IsOptional()
  reference?: string;
}
