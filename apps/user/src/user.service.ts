import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UserService {
  private repository: Repository<UserEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserEntity);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<UserEntity> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(user: CreateUserDto): Promise<UserEntity> {
    return this.repository.save(user);
  }

  async update(id: string, user: CreateUserDto): Promise<UserEntity> {
    await this.repository.update(id, user);
    return this.repository.findOne({
      where: { id },
    });
  }
}
