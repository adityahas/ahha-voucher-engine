import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';

@Controller('auth')
export class LoginController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() body: { email: string }) {
    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { email: body.email },
      relations: { role: { permissions: true } },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      permissions: user.role.permissions.map((p) => p.name),
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
