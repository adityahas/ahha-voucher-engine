import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: any): Promise<any> {
    return createClientDto;
  }

  async findAll(): Promise<any[]> {
    return [];
  }

  async findOne(database_name: string): Promise<any> {
    return this.clientRepository.findOne({
      where: { database_name },
    });
  }

  async update(id: string, updateClientDto: any): Promise<any> {
    return updateClientDto;
  }

  async findByDatabaseName(databaseName: string) {
    return this.clientRepository.findOne({
      where: { database_name: databaseName },
    });
  }
}
