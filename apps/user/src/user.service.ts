import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { DataSource, Repository } from 'typeorm';
import { EncryptionService } from '@core/encryption';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserService {
  private userRepository: Repository<UserEntity>;

  constructor(
    dataSource: DataSource,
    private readonly encryptionService: EncryptionService,
    private readonly jwtService: JwtService,
  ) {
    this.userRepository = dataSource.getRepository(UserEntity);
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: loginUserDto.email },
    });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isMatch = this.encryptionService.comparePassword(
      loginUserDto.password,
      user.password,
    );
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    return { user, token };
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
