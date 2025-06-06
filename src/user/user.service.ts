import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async assignRolesToUser(assignRoleDto: AssignRoleDto) {
    const { userId, roleIds } = assignRoleDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
    });
    if (roles.length !== roleIds.length)
      throw new BadRequestException('One or more roles not found');

    await this.prisma.userRole.deleteMany({ where: { userid: userId } });

    const userRoles = roleIds.map((roleId) => ({
      userid: userId,
      roleid: roleId,
    }));
    await this.prisma.userRole.createMany({ data: userRoles });

    return { message: 'Roles assigned to user successfully' };
  }
}
