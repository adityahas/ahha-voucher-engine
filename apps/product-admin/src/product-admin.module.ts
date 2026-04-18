import { PassportModule } from '@nestjs/passport';
import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
  Scope,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductAdminService } from './product-admin.service';
import { ProductAdminController } from './product-admin.controller';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryController } from './product-category.controller';
import { DatabaseModule, DatabaseService } from '@core/database';
import { AuthModule } from '@core/auth';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { ClientEntity } from '@core/database/entities/client.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@core/auth/constants';
import { JwtStrategy } from '@core/auth/jwt.strategy';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: false,
      logging: process.env.DB_LOGGING != 'false',
      entities: [ClientEntity],
    }),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1w' },
    }),
    DatabaseModule,
    forwardRef(() => AuthModule),
  ],
  providers: [
    JwtStrategy,
    ProductAdminService,
    ProductCategoryService,
    {
      provide: 'PRODUCT_ADMIN_CONNECTION',
      scope: Scope.REQUEST,
      useFactory: async (
        request: Request,
        databaseService: DatabaseService,
      ): Promise<DataSource> => {
        const databaseName = request['client'].database_name;
        return await databaseService.getConnection(
          databaseName,
          __dirname + '/../../../**/*.entity{.ts,.js}',
        );
      },
      inject: [REQUEST, DatabaseService],
    },
  ],
  controllers: [ProductAdminController, ProductCategoryController],
  exports: [
    ProductAdminService,
    ProductCategoryService,
    'PRODUCT_ADMIN_CONNECTION',
  ],
})
export class ProductAdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware, CredentialMiddleware).forRoutes('*');
  }
}
