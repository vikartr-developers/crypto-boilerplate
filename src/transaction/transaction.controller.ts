import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ResponseInterceptor } from 'src/common/response/response.interceptor';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  createTransaction(@Body() dto: CreateTransactionDto) {
    return this.transactionService.createTransaction(dto);
  }

  @Get(':id')
  getTransactionById(@Param('id') id: string) {
    return this.transactionService.getTransactionById(id);
  }

  @Get()
  getUserTransactions(
    @Query('userId') userId: string,
    @Query('coin') coin?: string,
  ) {
    return this.transactionService.getUserTransactions(userId, coin);
  }

  @Put(':id')
  updateTransaction(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionService.updateTransaction(id, dto);
  }

  @Delete(':id')
  deleteTransaction(@Param('id') id: string) {
    return this.transactionService.deleteTransaction(id);
  }
}
