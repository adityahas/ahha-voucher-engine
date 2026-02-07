import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { EncryptionService } from '@core/encryption';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UserConsumerService {
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

    const payload = { email: user.email, sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    return { user, token };
  }
}
