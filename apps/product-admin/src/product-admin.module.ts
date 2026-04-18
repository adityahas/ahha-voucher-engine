import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@core/product/entities/product.entity';
import { ProductAdminService } from './product-admin.service';
import { ProductAdminController } from './product-admin.controller';
import { DatabaseModule } from '@core/database';
import { AuthModule } from '@core/auth';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { CredentialMiddleware, SubdomainMiddleware } from '@core/middleware';
import * as dotenv from 'dotenv';

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
      logging: process.env.DB_LOGGING != 'false',
      autoLoadEntities: true,
      entities: [__dirname + '/../../../**/*.entity{.ts,.js}'],
    }),
    TypeOrmModule.forFeature([ProductEntity]),
    DatabaseModule,
    AuthModule,
  ],
  providers: [ProductAdminService],
  controllers: [ProductAdminController],
  exports: [ProductAdminService],
})
export class ProductAdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware, CredentialMiddleware).forRoutes('*');
  }
}
