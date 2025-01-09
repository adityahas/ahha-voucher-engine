import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../client/entities/client.entity';
import { ClientsService } from '../client/client.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [DatabaseService, ClientsService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
