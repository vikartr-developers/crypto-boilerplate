import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseInterceptor } from 'src/common/response/response.interceptor';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('user')
@UseInterceptors(ResponseInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('assign-role')
  @UseGuards(JwtAuthGuard)
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.userService.assignRolesToUser(assignRoleDto);
  }
}
