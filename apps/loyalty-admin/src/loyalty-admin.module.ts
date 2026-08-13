import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
  RequestMethod,
  Scope,
} from '@nestjs/common';
import * as dotenv from 'dotenv';
import { LoyaltyAdminService } from './loyalty-admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@core/auth/constants';
import { AuthModule } from '@core/auth';
import { DatabaseModule, DatabaseService } from '@core/database';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import { JwtStrategy } from '@core/auth/jwt.strategy';
import { VoucherModule } from './voucher/voucher.module';
import { RewardItemModule } from './reward-item/reward-item.module';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { LoyaltyAdminController } from './loyalty-admin.controller';
import { ClientEntity } from '@core/database/entities/client.entity';
import { RewardItemSourceModule } from './reward-item-source/reward-item-source.module';
import { TierModule } from './tier/tier.module';
import { VoucherCategoryModule } from './voucher-category/voucher-category.module';
import { UserPointsModule } from './user-points/user-points.module';
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
    AuthModule,
    DatabaseModule,
    VoucherModule,
    VoucherCategoryModule,
    RewardItemModule,
    RewardItemSourceModule,
    forwardRef(() => TierModule),
    forwardRef(() => UserPointsModule),
  ],
  controllers: [LoyaltyAdminController, HealthController],
  providers: [
    LoyaltyAdminService,
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
          __dirname + '/../../../**/*.entity{.ts,.js}',
          __dirname + '/migrations/*{.ts,.js}',
        );
      },
      inject: [REQUEST, DatabaseService],
    },
  ],
  exports: ['LOYALTY_CONNECTION'],
})
export class LoyaltyAdminModule implements NestModule, OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  onApplicationBootstrap() {
    const loadedEntities = this.dataSource.entityMetadatas.map((e) => e.name);
    console.log('Loaded entities:', loadedEntities);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SubdomainMiddleware, CredentialMiddleware)
      .exclude({ path: 'health', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
