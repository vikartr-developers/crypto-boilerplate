import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletBalanceDto } from './dto/update-wallet.dto';
import { TransactionType } from 'src/common/enum/transaction-type.enum';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import Stripe from 'stripe';
import { DepositDto } from './dto/deposit.dto';

@Injectable()
export class WalletService {
  private stripe: Stripe;
  constructor(private readonly prisma: PrismaService) {}

  async createWallet(createWalletDto: CreateWalletDto) {
    const { userId, currency } = createWalletDto;

    const existing = await this.prisma.wallet.findFirst({
      where: { userId, coin: currency.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(`Wallet for ${currency} already exists`);
    }

    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        coin: currency.toUpperCase(),
        address: this.generateWalletAddress(currency),
      },
    });

    return { message: 'Wallet created successfully', data: wallet };
  }

  async updateWalletBalance(dto: UpdateWalletBalanceDto) {
    const { userId, currency, amount } = dto;
    const coin = currency.toUpperCase();

    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, coin },
    });

    if (!wallet) {
      throw new BadRequestException(`Wallet for ${coin} not found`);
    }

    const newBalance = wallet.balance + amount;
    if (newBalance < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    return {
      message: 'Wallet balance updated successfully',
      data: updatedWallet,
    };
  }

  async handleTransaction(dto: CreateTransactionDto) {
    const { userId, coin, amount, type, note } = dto;

    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, coin: coin.toUpperCase() },
    });

    if (!wallet) throw new BadRequestException('Wallet not found');

    const balanceBefore = wallet.balance;
    let balanceAfter = balanceBefore;

    if (type === TransactionType.DEPOSIT) {
      balanceAfter += amount;
    } else if (type === TransactionType.WITHDRAW) {
      if (balanceBefore < amount)
        throw new BadRequestException('Insufficient balance');
      balanceAfter -= amount;
    } else {
      throw new BadRequestException('Unsupported transaction type');
    }

    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        note,
      },
    });

    return {
      message: 'Transaction successful',
      data: updatedWallet,
    };
  }

  async deposit(userId: string, dto: DepositDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { userId, coin: dto.coin },
    });
    if (!wallet) throw new BadRequestException('Wallet not found');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `Deposit ${dto.coin}` },
            unit_amount: Math.floor(dto.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        userId,
        walletId: wallet.id,
        amount: dto.amount,
        coin: dto.coin,
        type: 'DEPOSIT',
      },
    });

    return {
      message: 'Stripe session created',
      sessionId: session.id,
      url: session.url,
    };
  }

  async handleStripeWebhook(req: Request, sig: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session?.metadata?.userId;
      const walletId = session?.metadata?.walletId;
      const amount = parseFloat(session?.metadata?.amount!);
      const coin = session?.metadata?.coin;

      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId },
      });
      if (!wallet) throw new BadRequestException('Wallet not found');

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amount;

      await this.prisma.wallet.update({
        where: { id: walletId },
        data: {
          balance: balanceAfter,
          transactions: {
            create: {
              userId,
              type: 'DEPOSIT',
              amount,
              balanceBefore,
              balanceAfter,
              note: 'Stripe deposit',
            },
          },
        },
      });

      return { received: true };
    }

    return { received: false };
  }

  private generateWalletAddress(currency: string): string {
    return `${currency.toLowerCase()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
