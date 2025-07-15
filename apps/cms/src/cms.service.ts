import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { DatabaseService } from '@core/database';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { LoginAdminDto } from './dto/login-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminEntity } from './entities/admin.entity';

@Injectable()
export class CmsService {
  constructor(
    private readonly databaseService: DatabaseService,
    @InjectRepository(AdminEntity)
    private readonly adminRepository: Repository<AdminEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(databaseName: string, loginAdminDto: LoginAdminDto) {
    const admin = await this.adminRepository.findOne({
      where: { email: loginAdminDto.email },
      relations: ['client'],
    });

    if (!admin || admin.client.database_name !== databaseName) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await this.databaseService.comparePassword(
      loginAdminDto.password,
      admin.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    console.log('databaseName', databaseName);
    if (!this.databaseService.checkConnectionExists(databaseName)) {
      await this.databaseService.createConnection(databaseName);
    }

    const payload = { email: admin.email, sub: admin.id, role: admin.role };
    const token = this.jwtService.sign(payload);

    return { admin, token };
  }

  create(createAdminDto: CreateAdminDto) {
    return 'This action adds a new admin';
  }

  findAll() {
    return `This action returns all admin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} admin`;
  }

  update(id: number, updateAdminDto: UpdateAdminDto) {
    return `This action updates a #${id} admin`;
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }
}
