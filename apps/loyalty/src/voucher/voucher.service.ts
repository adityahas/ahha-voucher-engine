import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Voucher } from './entities/voucher.entity';
import { GetVoucherEligibleVoucherDto } from './dto/get-voucher-eligible-voucher.dto';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '@core/user/entities/user.entity';
import { VoucherCategory } from './entities/voucher-category.entity';

@Injectable()
export class VoucherService {
  private repository: Repository<Voucher>;
  private userRepository: Repository<User>;
  private voucherCategoryRepository: Repository<VoucherCategory>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Voucher);
    this.userRepository = dataSource.getRepository(User);
    this.voucherCategoryRepository = dataSource.getRepository(VoucherCategory);
  }

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    const voucher = new Voucher();
    Object.assign(voucher, createVoucherDto);

    if (createVoucherDto.target_users && createVoucherDto.target_users.length > 0) {
      voucher.target_users = await this.userRepository.findBy({ id: In(createVoucherDto.target_users) });
    }

    if (createVoucherDto.categories && createVoucherDto.categories.length > 0) {
      voucher.categories = await this.voucherCategoryRepository.findBy({ slug: In(createVoucherDto.categories.map(c => c.slug)) });
    }

    if (createVoucherDto.allow_combine_categories && createVoucherDto.allow_combine_categories.length > 0) {
      voucher.allow_combine_categories = await this.voucherCategoryRepository.findBy({ slug: In(createVoucherDto.allow_combine_categories.map(c => c.slug)) });
    }

    return this.repository.save(voucher);
  }

  async findAll(): Promise<Voucher[]> {
    return this.repository.find({
      relations: ['categories', 'target_users', 'bindings', 'validities'],
    });
  }

  async findOne(id: string): Promise<Voucher> {
    return this.repository.findOne({
      where: { code: id },
    });
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    const voucher = await this.repository.findOne({ where: { code: id } });

    if (!voucher) {
      throw new NotFoundException(`Voucher with code ${id} not found.`);
    }

    if (updateVoucherDto.target_users !== undefined) {
      voucher.target_users = await this.userRepository.findBy({ id: In(updateVoucherDto.target_users) });
    }

    if (updateVoucherDto.categories && updateVoucherDto.categories.length > 0) {
      voucher.categories = await this.voucherCategoryRepository.findBy({ slug: In(updateVoucherDto.categories.map(c => c.slug)) });
    }

    if (updateVoucherDto.allow_combine_categories && updateVoucherDto.allow_combine_categories.length > 0) {
      voucher.allow_combine_categories = await this.voucherCategoryRepository.findBy({ slug: In(updateVoucherDto.allow_combine_categories.map(c => c.slug)) });
    }

    Object.assign(voucher, updateVoucherDto);
    return this.repository.save(voucher);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async getEligibleVouchers(
    searchCriteria: GetVoucherEligibleVoucherDto,
  ): Promise<Voucher[]> {
    const queryBuilder = this.repository.createQueryBuilder('voucher');
    let isWhereClauseAdded = false;

    if (searchCriteria.user_id) {
      queryBuilder.leftJoinAndSelect(
        'voucher.target_users',
        'user',
        'user.id = :userId',
        {
          userId: searchCriteria.user_id,
        },
      );
    }

    if (searchCriteria.bindings && searchCriteria.bindings.length > 0) {
      queryBuilder.leftJoinAndSelect('voucher.bindings', 'binding');
      searchCriteria.bindings.forEach((binding, index) => {
        const whereClause = `(binding.bind_type = :bindType${index} AND binding.bind_value = :bindValue${index})`;
        const whereValue = {
          [`bindType${index}`]: binding.bind_type,
          [`bindValue${index}`]: binding.bind_value,
        };
        if (!isWhereClauseAdded) {
          isWhereClauseAdded = true;
          queryBuilder.where(whereClause, whereValue);
        } else {
          queryBuilder.orWhere(whereClause, whereValue);
        }
      });
    }

    return queryBuilder.getMany();
  }
}
