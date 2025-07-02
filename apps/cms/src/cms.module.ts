import { forwardRef, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@core/auth';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { JwtStrategy } from '@core/auth/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '@core/auth/constants';
import { DatabaseModule } from '@core/database';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import { Admin } from './entities/admin.entity';

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
      synchronize: process.env.DB_SYNC == 'true',
      dropSchema: process.env.DB_DROP_SCHEMA == 'true',
      logging: process.env.DB_LOGGING != 'false',
      autoLoadEntities: true,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    }),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
    forwardRef(() => AuthModule),
    DatabaseModule,
    TypeOrmModule.forFeature([Admin]),
  ],
  controllers: [CmsController],
  providers: [CmsService, JwtStrategy],
  exports: [CmsService],
})
export class CmsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware, CredentialMiddleware).forRoutes('*');
  }
}
