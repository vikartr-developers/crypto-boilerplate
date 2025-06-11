import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ScriptService } from './script.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ResponseInterceptor } from 'src/common/response/response.interceptor';
import { PaginationQueryDto } from 'src/common/response/dto/pagination-query.dto';

@Controller('scripts')
@UseInterceptors(ResponseInterceptor)
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Post('sync-binance')
  //   @UseGuards(JwtAuthGuard)
  syncScriptsFromBinance() {
    return this.scriptService.fetchAndAddBinanceScripts();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  getAllScripts(@Query() query: PaginationQueryDto) {
    return this.scriptService.getAllScripts({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder as 'asc' | 'desc',
    });
  }
}
