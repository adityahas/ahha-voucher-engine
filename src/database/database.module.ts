import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/clients.entity';
import {ClientsService} from '../clients/clients.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [DatabaseService, ClientsService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
