import { Injectable } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../../user/src/entities/user.entity';
import { EncryptionService } from '@core/encryption';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthConsumerService {
  private userRepository: Repository<UserEntity>;

  constructor(
    dataSource: DataSource,
    private readonly encryptionService: EncryptionService,
    private readonly jwtService: JwtService,
  ) {
    this.userRepository = dataSource.getRepository(UserEntity);
  }

  getHello(): string {
    return 'Hello World!';
  }

  async login(databaseName: string, loginUserDto: LoginUserDto) {
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
}
