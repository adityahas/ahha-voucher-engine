import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Scope,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@core/auth';
import { JwtStrategy } from '@core/auth/jwt.strategy';
import { Request } from 'express';
import { DatabaseModule, DatabaseService } from '@core/database';
import { DataSource } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ClientEntity } from '@core/database/entities/client.entity';
import { jwtConstants } from '@core/auth/constants';
import * as dotenv from 'dotenv';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import { UserConsumerController } from './user-consumer.controller';
import { UserConsumerService } from './user-consumer.service';
import { EncryptionService } from '@core/encryption';
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
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1w' },
    }),
    DatabaseModule,
    AuthModule,
  ],
  providers: [
    JwtStrategy,
    UserConsumerService,
    {
      provide: 'USER_CONSUMER_CONNECTION',
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
    {
      provide: 'USER_CONSUMER_SERVICE',
      scope: Scope.REQUEST,
      useFactory: async (
        dataSource: DataSource,
        encryptionService: EncryptionService,
        jwtService: JwtService,
      ) => {
        return new UserConsumerService(
          dataSource,
          encryptionService,
          jwtService,
        );
      },
      inject: ['USER_CONSUMER_CONNECTION', EncryptionService, JwtService],
    },
  ],
  controllers: [UserConsumerController, HealthController],
  exports: ['USER_CONSUMER_CONNECTION'],
})
export class UserConsumerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SubdomainMiddleware, CredentialMiddleware)
      .exclude({ path: 'health', method: RequestMethod.ALL })
      .forRoutes('*');
  }
}
