import { Body, Controller, Patch, Post, Req, UseInterceptors } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ResponseInterceptor } from 'src/common/response/response.interceptor';
import { UpdateWalletBalanceDto } from './dto/update-wallet.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('wallet')
@UseInterceptors(ResponseInterceptor)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  createWallet(@Body() dto: CreateWalletDto) {
    return this.walletService.createWallet(dto);
  }

  @Patch('update-balance')
  updateWalletBalance(@Body() dto: UpdateWalletBalanceDto) {
    return this.walletService.updateWalletBalance(dto);
  }

  @Post('transaction')
  handleTransaction(@Body() dto: CreateTransactionDto) {
    return this.walletService.handleTransaction(dto);
  }


}
