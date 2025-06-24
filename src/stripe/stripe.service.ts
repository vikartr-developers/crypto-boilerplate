import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  async createCheckoutSession(
    userId: string,
    walletId: string,
    amount: number,
  ) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usdmm',
            unit_amount: amount * 100,
            product_data: {
              name: 'Deposit to Wallet',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId,
        walletId,
      },
    });

    return {
      message: 'Stripe checkout session created successfully',
      data: {
        url: session.url,
        sessionId: session.id,
      },
    };
  }

  constructEvent(payload: Buffer, signature: string, secret: string) {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  async createPayout(accountId: string, amount: number) {
    const payout = await this.stripe.payouts.create(
      {
        amount: amount * 100,
        currency: 'usd',
        method: 'standard',
      },
      {
        stripeAccount: accountId,
      },
    );

    return payout;
  }
}
