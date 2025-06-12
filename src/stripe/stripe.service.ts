import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from 'src/prisma/prisma.service';
import { DepositDto } from 'src/wallet/dto/deposit.dto';
import { WithdrawDto } from 'src/wallet/dto/withdraw.dto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

@Injectable()
export class StripeService {
  constructor(private prisma: PrismaService) {}

  async createDeposit(userId: string, dto: DepositDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, coin: dto.coin },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found for selected coin');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(dto.amount * 100),
      currency: 'inr',
      metadata: { userId, walletId: wallet.id },
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: dto.amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance, 
        note: 'Deposit initiated',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      message: 'Deposit initiated',
    };
  }


  async withdraw(userId: string, dto: WithdrawDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, coin: dto.coin },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (wallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance - dto.amount },
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'WITHDRAW',
        amount: dto.amount,
        balanceBefore: wallet.balance,
        balanceAfter: updatedWallet.balance,
        note: 'Withdrawal processed',
      },
    });

    return { message: 'Withdrawal successful' };
  }
}
