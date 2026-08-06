import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Scope,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule, DatabaseService } from '@core/database';
import { AuthModule } from '@core/auth';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import { ClientEntity } from '@core/database/entities/client.entity';
import { ClientSettingsEntity } from '@core/database/entities/client-settings.entity';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import { ProductConsumerController } from './product-consumer.controller';
import { PurchaseConsumerController } from './purchase-consumer.controller';
import { PurchaseConsumerService } from './purchase-consumer.service';
import { HealthController } from '@core/base';
import { SettingsController } from './settings/settings.controller';

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
      entities: [ClientEntity, ClientSettingsEntity],
    }),
    DatabaseModule,
    AuthModule,
    HttpModule,
    TypeOrmModule.forFeature([ClientSettingsEntity]),
  ],
  providers: [
    PurchaseConsumerService,
    ClientSettingsService,
    {
      provide: 'PRODUCT_CONSUMER_CONNECTION',
      scope: Scope.REQUEST,
      useFactory: async (
        request: Request,
        databaseService: DatabaseService,
      ): Promise<DataSource> => {
        const databaseName = request['client'].database_name;
        return await databaseService.getConnection(
          databaseName,
          __dirname + '/../../../libs/product/src/entities/*.entity{.ts,.js}',
        );
      },
      inject: [REQUEST, DatabaseService],
    },
  ],
  controllers: [
    ProductConsumerController,
    PurchaseConsumerController,
    SettingsController,
    HealthController,
  ],
  exports: ['PRODUCT_CONSUMER_CONNECTION'],
})
export class ProductConsumerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SubdomainMiddleware, CredentialMiddleware)
      .exclude({ path: 'health', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
