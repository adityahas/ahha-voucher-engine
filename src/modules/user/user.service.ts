import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { DatabaseService } from '../../database/database.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService extends BaseService {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findAll(databaseName: string): Promise<User[]> {
    const userRepository = await this.getRepository(databaseName, User);
    return userRepository.find();
  }

  async findOne(databaseName: string, id: string): Promise<User> {
    const userRepository = await this.getRepository(databaseName, User);
    return userRepository.findOne({
      where: { id },
    });
  }

  async create(databaseName: string, user: CreateUserDto): Promise<User> {
    const userRepository = await this.getRepository(databaseName, User);
    return userRepository.save(user);
  }

  async update(
    databaseName: string,
    id: string,
    user: CreateUserDto,
  ): Promise<User> {
    const userRepository = await this.getRepository(databaseName, User);
    await userRepository.update(id, user);
    return userRepository.findOne({
      where: { id },
    });
  }
}
