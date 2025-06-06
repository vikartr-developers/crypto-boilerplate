import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { PermissionService } from './permission/permission.service';
import { PermissionController } from './permission/permission.controller';
import { PermissionModule } from './permission/permission.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, AuthModule, RoleModule, PermissionModule, UserModule],
  controllers: [AppController, PermissionController, UserController],
  providers: [AppService, PermissionService],
})
export class AppModule {}
