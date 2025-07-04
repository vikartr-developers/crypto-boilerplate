import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ResponseInterceptor } from 'src/common/response/response.interceptor';
import { PaginationQueryDto } from 'src/common/response/dto/pagination-query.dto';
import { AssignPermissionsDto } from './dto/assign-permission.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('permission')
@UseInterceptors(ResponseInterceptor)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: PaginationQueryDto) {
    return this.permissionService.findAll({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder as 'asc' | 'desc',
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.permissionService.remove(id);
  }

  @Post('assign-to-role/:roleId')
  @UseGuards(JwtAuthGuard)
  assignPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.permissionService.assignPermissionsToRole(
      roleId,
      assignPermissionsDto.permissionIds,
    );
  }
}
