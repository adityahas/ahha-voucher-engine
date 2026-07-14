import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Scope,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@core/auth/constants';
import { AuthModule } from '@core/auth';
import { DatabaseModule, DatabaseService } from '@core/database';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import { JwtStrategy } from '@core/auth/jwt.strategy';
import { ClientEntity } from '@core/database/entities/client.entity';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { RedistroService } from './redistro.service';
import { RedistroController } from './redistro.controller';
import { RetailerModule } from './retailer/retailer.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { HealthController } from '@core/base';

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
      dropSchema: process.env.DB_DROP_SCHEMA == 'true',
      logging: process.env.DB_LOGGING != 'false',
      autoLoadEntities: false,
      entities: [ClientEntity],
    }),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1w' },
    }),
    DatabaseModule,
    AuthModule,
    RetailerModule,
    WarehouseModule,
  ],
  controllers: [RedistroController, HealthController],
  providers: [
    {
      provide: RedistroService,
      scope: Scope.REQUEST,
      useFactory: async (dataSource: DataSource) => {
        return new RedistroService(dataSource);
      },
      inject: ['REDISTRO_CONNECTION'],
    },
    JwtStrategy,
    {
      provide: 'REDISTRO_CONNECTION',
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
  exports: [RedistroService, 'REDISTRO_CONNECTION'],
})
export class RedistroModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SubdomainMiddleware, CredentialMiddleware)
      .exclude({ path: 'health', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
