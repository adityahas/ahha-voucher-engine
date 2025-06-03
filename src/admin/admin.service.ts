import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { DatabaseService } from '../database/database.service';
import { BaseService } from '../base/base.service';
import { Admin } from './entities/admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService extends BaseService {
  constructor(
    private readonly databaseService: DatabaseService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {
    super(databaseService);
  }

  async login(databaseName: string, loginAdminDto: LoginAdminDto) {
    const admin = await this.adminRepository.findOne({
      where: { email: loginAdminDto.email },
      relations: ['client'],
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await this.databaseService.comparePassword(
      loginAdminDto.password,
      admin.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!this.databaseService.checkConnectionExists(databaseName)) {
      await this.databaseService.createConnection(databaseName);
    }

    const payload = { email: admin.email, sub: admin.id };
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
