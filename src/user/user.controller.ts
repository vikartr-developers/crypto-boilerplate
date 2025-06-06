import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from 'src/common/response/response.interceptor';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UserService } from './user.service';

@Controller('user')
@UseInterceptors(ResponseInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('assign-role')
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.userService.assignRolesToUser(assignRoleDto);
 }
}