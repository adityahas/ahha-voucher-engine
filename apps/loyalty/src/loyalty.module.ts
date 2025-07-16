import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
  Scope,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@core/auth/constants';
import { AuthModule } from '@core/auth';
import { DatabaseModule, DatabaseService } from '@core/database';
import * as dotenv from 'dotenv';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import { JwtStrategy } from '@core/auth/jwt.strategy';
import { VoucherModule } from './voucher/voucher.module';
import { LoyaltyUserEntity } from './entities/loyalty-user.entity';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { LoyaltyController } from './loyalty.controller';

dotenv.config();

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
    // DatabaseModule,
    TypeOrmModule.forFeature([LoyaltyUserEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => DatabaseModule),
    forwardRef(() => VoucherModule),
  ],
  controllers: [LoyaltyController],
  providers: [
    LoyaltyService,
    JwtStrategy,
    {
      provide: 'LOYALTY_CONNECTION',
      scope: Scope.REQUEST,
      useFactory: async (
        request: Request,
        databaseService: DatabaseService,
      ): Promise<DataSource> => {
        const databaseName = request['client'].database_name;
        return await databaseService.getConnection(
          databaseName,
          __dirname + '/**/*.entity{.ts,.js}',
        );
      },
      inject: [REQUEST, DatabaseService],
    },
  ],
  exports: [LoyaltyService, 'LOYALTY_CONNECTION'],
})
export class LoyaltyModule implements NestModule, OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  onApplicationBootstrap() {
    const loadedEntities = this.dataSource.entityMetadatas.map((e) => e.name);
    console.log('Loaded entities:', loadedEntities);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware, CredentialMiddleware).forRoutes('*');
  }
}
