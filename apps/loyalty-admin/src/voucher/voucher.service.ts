import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { DataSource, In, Repository } from 'typeorm';
import { VoucherEntity } from '@core/loyalty/voucher/entities/voucher.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Injectable()
export class VoucherService {
  private repository: Repository<VoucherEntity>;
  private userRepository: Repository<LoyaltyUserEntity>;
  private voucherCategoryRepository: Repository<VoucherCategoryEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(VoucherEntity);
    this.userRepository = dataSource.getRepository(LoyaltyUserEntity);
    this.voucherCategoryRepository = dataSource.getRepository(
      VoucherCategoryEntity,
    );
  }

  async create(createVoucherDto: CreateVoucherDto): Promise<VoucherEntity> {
    const voucher = new VoucherEntity();
    Object.assign(voucher, createVoucherDto);

    if (
      createVoucherDto.target_users &&
      createVoucherDto.target_users.length > 0
    ) {
      voucher.target_users = await this.userRepository.findBy({
        id: In(createVoucherDto.target_users),
      });
    }

    if (createVoucherDto.categories && createVoucherDto.categories.length > 0) {
      voucher.categories = await this.voucherCategoryRepository.findBy({
        slug: In(createVoucherDto.categories.map((c) => c.slug)),
      });
    }

    if (
      createVoucherDto.allow_combine_categories &&
      createVoucherDto.allow_combine_categories.length > 0
    ) {
      voucher.allow_combine_categories =
        await this.voucherCategoryRepository.findBy({
          slug: In(
            createVoucherDto.allow_combine_categories.map((c) => c.slug),
          ),
        });
    }

    return this.repository.save(voucher);
  }

  async findAll(
    paginationDto: BasePaginationDto,
  ): Promise<BasePaginationResponseInterface<VoucherEntity>> {
    const { page, size, search, sort, order } = paginationDto;
    const skip = page * size;

    const queryBuilder = this.repository.createQueryBuilder('voucher');

    if (search) {
      console.log('cuuuuk', search);
      queryBuilder.where('voucher.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (sort && order) {
      queryBuilder.orderBy(`voucher.${sort}`, order);
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return {
      code: 'SUCCESS',
      message: 'Vouchers retrieved successfully',
      data,
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async findOne(id: string): Promise<VoucherEntity> {
    return this.repository.findOne({
      where: { code: id },
    });
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<VoucherEntity> {
    const voucher = await this.repository.findOne({ where: { code: id } });

    if (!voucher) {
      throw new NotFoundException(`Voucher with code ${id} not found.`);
    }

    if (updateVoucherDto.target_users !== undefined) {
      voucher.target_users = await this.userRepository.findBy({
        id: In(updateVoucherDto.target_users),
      });
    }

    if (updateVoucherDto.categories && updateVoucherDto.categories.length > 0) {
      voucher.categories = await this.voucherCategoryRepository.findBy({
        slug: In(updateVoucherDto.categories.map((c) => c.slug)),
      });
    }

    if (
      updateVoucherDto.allow_combine_categories &&
      updateVoucherDto.allow_combine_categories.length > 0
    ) {
      voucher.allow_combine_categories =
        await this.voucherCategoryRepository.findBy({
          slug: In(
            updateVoucherDto.allow_combine_categories.map((c) => c.slug),
          ),
        });
    }

    Object.assign(voucher, updateVoucherDto);
    return this.repository.save(voucher);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
