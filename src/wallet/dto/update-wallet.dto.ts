import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class UpdateWalletBalanceDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number; 
}
