import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { ClientsService } from '../client/client.service';
import { Client } from '../client/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Client])],
  controllers: [AdminController],
  providers: [AdminService, ClientsService],
})
export class AdminModule {}
