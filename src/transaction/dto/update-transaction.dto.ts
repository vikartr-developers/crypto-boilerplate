export class UpdateTransactionDto {
  type?: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'CONVERT';
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  note?: string;
}
