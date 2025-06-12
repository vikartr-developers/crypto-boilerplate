import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransactionType } from 'src/common/enum/transaction-type.enum';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  coin: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  note?: string;
}
