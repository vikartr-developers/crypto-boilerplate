import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import axios from 'axios';
import { findAllPaginated, PaginationOptions } from 'src/utils/pagination-helper';

@Injectable()
export class ScriptService {
  constructor(private prisma: PrismaService) {}

  async fetchAndAddBinanceScripts() {
    try {
      const response = await axios.get(
        'https://api.binance.com/api/v3/exchangeInfo',
      );
      const symbols = response.data.symbols;

      const newScripts = [] as any;

      for (const symbol of symbols) {
        const exists = await this.prisma.script.findFirst({
          where: { symbol: symbol.symbol },
        });

        if (!exists) {
          const newScript = await this.prisma.script.create({
            data: {
              symbol: symbol.symbol,
              baseAsset: symbol.baseAsset,
              quoteAsset: symbol.quoteAsset,
              status: symbol.status,
            },
          });
          newScripts.push(newScript);
        }
      }

      return {
        message: 'Scripts added successfully',
        data: newScripts,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to sync Binance scripts');
    }
  }

  async getAllScripts(params: PaginationOptions) {
    const result = await findAllPaginated(this.prisma.script, {
      ...params,
      searchFields: ['symbol', 'baseAsset', 'quoteAsset'],
    });

    return {
      message: 'Scripts fetched successfully',
      data: result.data,
      pagination: result.pagination,
    };
  }
}

