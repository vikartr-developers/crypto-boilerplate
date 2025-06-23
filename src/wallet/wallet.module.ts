import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [WalletService,PrismaService]
})
export class WalletModule {}
