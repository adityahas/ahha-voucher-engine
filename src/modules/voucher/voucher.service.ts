import { Injectable } from '@nestjs/common';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Voucher } from './entities/voucher.entity';
import { GetVoucherEligibleVoucherDto } from './dto/get-voucher-eligible-voucher.dto';
import { BaseService } from '../../base/base.service';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class VoucherService extends BaseService {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async create(
    databaseName: string,
    createVoucherDto: CreateVoucherDto,
  ): Promise<Voucher> {
    const voucherRepository = this.getRepository(databaseName, Voucher);

    // // Check if voucher category exists
    // const voucherCategories = await this.voucherCategoryRepository.findBy({
    //   slug: In(createVoucherDto.categories.map((category) => category.slug)),
    // });
    //
    // console.log('voucherCategories', voucherCategories);
    const voucher = voucherRepository.create(createVoucherDto);
    return voucherRepository.save(voucher);
  }

  async findAll(databaseName: string): Promise<Voucher[]> {
    const voucherRepository = this.getRepository(databaseName, Voucher);
    return voucherRepository.find({
      relations: ['categories', 'target_users', 'bindings', 'validities'],
    });
  }

  async findOne(databaseName: string, id: string): Promise<Voucher> {
    const voucherRepository = this.getRepository(databaseName, Voucher);
    return voucherRepository.findOne({
      where: { code: id },
    });
  }

  async update(
    databaseName: string,
    id: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    const voucherRepository = this.getRepository(databaseName, Voucher);
    await voucherRepository.update(id, updateVoucherDto);
    return voucherRepository.findOne({
      where: { code: id },
    });
  }

  async remove(databaseName: string, id: number): Promise<void> {
    const voucherRepository = this.getRepository(databaseName, Voucher);
    await voucherRepository.delete(id);
  }

  async getEligibleVouchers(
    databaseName: string,
    searchCriteria: GetVoucherEligibleVoucherDto,
  ): Promise<Voucher[]> {
    const voucherRepository = this.getRepository(databaseName, Voucher);
    const queryBuilder = voucherRepository.createQueryBuilder('voucher');
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
