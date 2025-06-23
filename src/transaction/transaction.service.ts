import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(dto: CreateTransactionDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: dto.walletId },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.prisma.transaction.create({
      data: {
        userId: dto.userId,
        walletId: dto.walletId,
        type: dto.type,
        amount: dto.amount,
        balanceBefore: dto.balanceBefore,
        balanceAfter: dto.balanceAfter,
        note: dto.note,
      },
    });
  }

  async getTransactionById(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return { message: 'Transaction found', data: transaction };
  }

  async getUserTransactions(userId: string, coin?: string) {
    const walletFilter = coin ? { userId, coin } : { userId };

    const wallets = await this.prisma.wallet.findMany({
      where: walletFilter,
      include: { transactions: true },
    });

    const transactions = wallets.flatMap((wallet) => wallet.transactions);
    return { message: 'Transactions fetched', data: transactions };
  }

  async updateTransaction(id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Transaction not found');

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: { ...dto },
    });

    return { message: 'Transaction updated', data: updated };
  }

  async deleteTransaction(id: string) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Transaction not found');

    await this.prisma.transaction.delete({ where: { id } });
    return { message: 'Transaction deleted' };
  }
}
