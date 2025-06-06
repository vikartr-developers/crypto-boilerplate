import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { findAllPaginated, PaginationOptions } from 'src/utils/pagination-helper';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
      },
    });

    return { message: 'Role created successfully', data: role };
  }

  async findAll(params: PaginationOptions) {
    const result = await findAllPaginated(this.prisma.role, {
      ...params,
      searchFields: ['name'], 
    });

    return {
      message: 'Roles fetched successfully',
      data: result.data,
      pagination: result.pagination,
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new BadRequestException('Role not found');
    return { message: 'Role fetched successfully', data: role };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({ where: { id } });
    if (!existingRole) throw new BadRequestException('Role not found');

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });

    return { message: 'Role updated successfully', data: updatedRole };
  }

  async remove(id: string) {
    const existingRole = await this.prisma.role.findUnique({ where: { id } });
    if (!existingRole) throw new BadRequestException('Role not found');

    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted successfully' };
  }
}
