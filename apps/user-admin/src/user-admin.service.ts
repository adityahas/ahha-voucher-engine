import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UserAdminService {
  private userRepository: Repository<UserEntity>;

  constructor(dataSource: DataSource) {
    this.userRepository = dataSource.getRepository(UserEntity);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<UserEntity> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async create(user: CreateUserDto): Promise<UserEntity> {
    return this.userRepository.save(user);
  }

  async update(id: string, user: CreateUserDto): Promise<UserEntity> {
    await this.userRepository.update(id, user);
    return this.userRepository.findOne({
      where: { id },
    });
  }
}
