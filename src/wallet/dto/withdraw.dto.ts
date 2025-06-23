import { IsNumber, IsString } from 'class-validator';
export class WithdrawDto {
  @IsNumber()
  amount: number;

  @IsString()
  coin: string;
}
