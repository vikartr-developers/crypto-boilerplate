import { Body, Controller, Post, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { StripeService } from '../stripe/stripe.service';
import { Request } from 'express';

@Controller('transactions')
export class TransactionController {
  constructor(
    private transactionService: TransactionService,
    private stripeService: StripeService,
  ) {}

  @Post('deposit/initiate')
  async initiateDeposit(
    @Body() body: { userId: string; walletId: string; amount: number },
  ) {
    const { userId, walletId, amount } = body;
    return this.transactionService.createStripeDeposit(
      userId,
      walletId,
      amount,
    );
  }

  @Post('deposit/webhook')
  async stripeWebhook(@Req() req: Request) {
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const walletId = session.metadata.walletId;
      const amount = session.amount_total / 100;

      return await this.transactionService.confirmStripeWebhookDeposit(
        userId,
        walletId,
        amount,
      );
    }
  }

  @Post('withdraw/stripe')
  async withdrawToStripe(
    @Body() body: { userId: string; walletId: string; amount: number },
  ) {
    return this.transactionService.withdrawToStripe(
      body.userId,
      body.walletId,
      body.amount,
    );
  }
}
