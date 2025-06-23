import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { StripeService } from 'src/stripe/stripe.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionService, PrismaService, StripeService],
})
export class TransactionModule {}
