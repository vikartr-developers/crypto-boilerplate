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
import { RoleController } from './role/role.controller';
import { RoleService } from './role/role.service';
import { UserService } from './user/user.service';
import { BinanceService } from './binance/binance.service';
import { BinanceGateway } from './binance/binance.gateway';
import { ConfigModule } from '@nestjs/config';
import { ScriptService } from './script/script.service';
import { ScriptController } from './script/script.controller';
import { ScriptModule } from './script/script.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    RoleModule,
    PermissionModule,
    UserModule,
    ScriptModule,
  ],
  controllers: [
    AppController,
    PermissionController,
    UserController,
    RoleController,
    ScriptController,
  ],
  providers: [
    AppService,
    PermissionService,
    RoleService,
    UserService,
    BinanceService,
    BinanceGateway,
    ScriptService,
  ],
})
export class AppModule {}
