import { Injectable } from '@nestjs/common';
import { UserEntity } from '@core/user/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  async update(id: string, user: UpdateUserDto): Promise<UserEntity> {
    await this.userRepository.update(id, user as any);
    return this.userRepository.findOne({
      where: { id },
    });
  }
}
