import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './clients.entity';
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

  async findOne(id: string): Promise<any> {
    return this.clientRepository.findOne({
      where: { id },
    });
  }

  async update(id: string, updateClientDto: any): Promise<any> {
    return updateClientDto;
  }

  async findBy(param: { database_name: string }) {
    return this.clientRepository.findOne({
      where: param,
    });
  }
}
