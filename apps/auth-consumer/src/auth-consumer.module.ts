import { Module, Scope } from '@nestjs/common';
import { AuthConsumerController } from './auth-consumer.controller';
import { AuthConsumerService } from './auth-consumer.service';
import { JwtStrategy } from '@core/auth/jwt.strategy';
import { Request } from 'express';
import { DatabaseService } from '@core/database';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';

@Module({
  imports: [],
  controllers: [AuthConsumerController],
  providers: [
    JwtStrategy,
    {
      provide: 'USER_CONNECTION',
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
    {
      provide: 'AUTH_CONSUMER_SERVICE',
      scope: Scope.REQUEST,
      useFactory: async (connection: DataSource) => {
        return new AuthConsumerService(connection);
      },
      inject: ['USER_CONNECTION'],
    },
  ],
})
export class AuthConsumerModule {}
