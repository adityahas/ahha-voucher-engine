import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetailerEntity } from './entities/retailer.entity';
import { RetailerService } from './retailer.service';
import { RetailerController } from './retailer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RetailerEntity])],
  providers: [RetailerService],
  controllers: [RetailerController],
  exports: [RetailerService],
})
export class RetailerModule {}
