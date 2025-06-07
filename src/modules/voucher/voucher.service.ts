import { Injectable } from '@nestjs/common';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Voucher } from './entities/voucher.entity';
import { GetVoucherEligibleVoucherDto } from './dto/get-voucher-eligible-voucher.dto';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class VoucherService {
  private repository: Repository<Voucher>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Voucher);
  }

  async create(createVoucherDto: CreateVoucherDto): Promise<Voucher> {
    // // Check if voucher category exists
    // const voucherCategories = await this.voucherCategoryRepository.findBy({
    //   slug: In(createVoucherDto.categories.map((category) => category.slug)),
    // });
    //
    // console.log('voucherCategories', voucherCategories);
    const voucher = this.repository.create(createVoucherDto);
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
    await this.repository.update(id, updateVoucherDto);
    return this.repository.findOne({
      where: { code: id },
    });
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
