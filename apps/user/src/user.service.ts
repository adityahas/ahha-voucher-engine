import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UserService {
  private repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<User> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(user: CreateUserDto): Promise<User> {
    return this.repository.save(user);
  }

  async update(id: string, user: CreateUserDto): Promise<User> {
    await this.repository.update(id, user);
    return this.repository.findOne({
      where: { id },
    });
  }
}
