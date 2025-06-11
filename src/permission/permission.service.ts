import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { findAllPaginated, PaginationOptions } from 'src/utils/pagination-helper';


@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const permission = await this.prisma.permission.create({
      data: {
        name: createPermissionDto.name,
        description: createPermissionDto?.description,
      },
    });

    return { message: 'Permission created successfully', data: permission };
  }

  async findAll(params: PaginationOptions) {
    const result = await findAllPaginated(this.prisma.permission, {
      ...params,
      searchFields: ['name'],
    });

    return {
      message: 'Permissions fetched successfully',
      data: result.data,
      pagination: result.pagination,
    };
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) throw new BadRequestException('Permission not found');
    return { message: 'Permission fetched successfully', data: permission };
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!existingPermission)
      throw new BadRequestException('Permission not found');

    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });

    return {
      message: 'Permission updated successfully',
      data: updatedPermission,
    };
  }

  async remove(id: string) {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!existingPermission)
      throw new BadRequestException('Permission not found');

    await this.prisma.permission.delete({ where: { id } });
    return { message: 'Permission deleted successfully' };
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new BadRequestException('Role not found');

    await this.prisma.rolePermission.deleteMany({ where: { roleId:roleId } });

    const rolePermissions = permissionIds.map((permissionId) => ({
      roleId: roleId,
      permissionId: permissionId,
    }));

    await this.prisma.rolePermission.createMany({ data: rolePermissions });

    return { message: 'Permissions assigned to role successfully', data: [] };
  }
}
