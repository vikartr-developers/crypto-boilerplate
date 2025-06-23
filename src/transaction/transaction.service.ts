import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async createStripeDeposit(userId: string, walletId: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        walletId,
        type: 'DEPOSIT',
        amount,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        status: 'PENDING',
        note: 'Stripe session initiating...',
      },
    });

    try {
      const stripeResponse = await this.stripeService.createCheckoutSession(
        userId,
        walletId,
        amount,
      );

      return {
        message: 'Stripe deposit session initiated successfully',
        data: {
          ...stripeResponse.data,
          transactionId: transaction.id,
        },
      };
    } catch (err) {
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: balanceBefore },
      });

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          note: `Stripe error: ${err.message}`,
        },
      });

      throw new BadRequestException('Stripe deposit failed');
    }
  }

  async confirmStripeWebhookDeposit(
    userId: string,
    walletId: string,
    amount: number,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    await this.prisma.wallet.update({
      where: { id: walletId },
      data: { balance: balanceAfter },
    });

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        walletId,
        type: 'DEPOSIT',
        amount,
        balanceBefore,
        balanceAfter,
        note: 'Stripe webhook deposit',
      },
    });

    return {
      message: 'Deposit confirmed and transaction recorded successfully',
      data: transaction,
    };
  }

  async withdrawToStripe(userId: string, walletId: string, amount: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!user || !user.stripeAccountId) {
      throw new BadRequestException('User or Stripe account not found');
    }

    if (!wallet || wallet.userId !== userId) {
      throw new BadRequestException('Wallet not found or unauthorized');
    }

    if (wallet.balance < amount) {
      await this.prisma.transaction.create({
        data: {
          userId,
          walletId,
          type: 'WITHDRAW',
          amount,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance,
          status: 'REJECTED',
          note: 'Insufficient balance for withdrawal',
        },
      });

      throw new BadRequestException('Insufficient balance');
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        walletId,
        type: 'WITHDRAW',
        amount,
        balanceBefore,
        balanceAfter,
        status: 'PENDING',
        note: 'Payout processing...',
      },
    });

    try {
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: balanceAfter },
      });

      const payout = await this.stripeService.createPayout(
        user.stripeAccountId,
        amount,
      );

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          note: `Payout success: ${payout.id}`,
        },
      });

      return {
        message: 'Withdrawal processed via Stripe',
        data: { transactionId: transaction.id, payout },
      };
    } catch (err) {
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: balanceBefore },
      });

      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          note: `Payout error: ${err.message}`,
        },
      });

      throw new BadRequestException('Withdrawal failed');
    }
  }
}
