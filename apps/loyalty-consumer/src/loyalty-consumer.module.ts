import { MiddlewareConsumer, Module, NestModule, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@core/auth';
import { JwtStrategy } from '@core/auth/jwt.strategy';
import { Request } from 'express';
import { DatabaseModule, DatabaseService } from '@core/database';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ClientEntity } from '@core/database/entities/client.entity';
import { jwtConstants } from '@core/auth/constants';
import * as dotenv from 'dotenv';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import { LoyaltyConsumerController } from './loyalty-consumer.controller';
import { LoyaltyConsumerService } from './loyalty-consumer.service';
import { VoucherModule } from './voucher/voucher.module';
import { RewardModule } from './reward/reward.module';

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
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1w' },
    }),
    DatabaseModule,
    AuthModule,
    VoucherModule,
    RewardModule,
  ],
  providers: [
    JwtStrategy,
    LoyaltyConsumerService,
    {
      provide: 'LOYALTY_CONSUMER_CONNECTION',
      scope: Scope.REQUEST,
      useFactory: async (
        request: Request,
        databaseService: DatabaseService,
      ): Promise<DataSource> => {
        const databaseName = request['client'].database_name;
        console.log('databaseName', databaseName);
        return await databaseService.getConnection(
          databaseName,
          __dirname + '/../../../**/*.entity{.ts,.js}',
        );
      },
      inject: [REQUEST, DatabaseService],
    },
  ],
  controllers: [LoyaltyConsumerController],
  exports: ['LOYALTY_CONSUMER_CONNECTION'],
})
export class LoyaltyConsumerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware, CredentialMiddleware).forRoutes('*');
  }
}
