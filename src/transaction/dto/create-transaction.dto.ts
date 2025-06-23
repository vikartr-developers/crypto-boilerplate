export class CreateTransactionDto {
  userId: string;
  walletId: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'CONVERT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  note?: string;
}
