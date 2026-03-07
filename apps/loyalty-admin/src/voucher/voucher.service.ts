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
    const {
      target_users,
      categories,
      allow_combine_categories,
      ...scalarFields
    } = createVoucherDto;
    Object.assign(voucher, scalarFields);

    if (target_users && target_users.length > 0) {
      voucher.target_users = await this.getOrCreateLoyaltyUsers(target_users);
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
    queryBuilder.leftJoinAndSelect('voucher.categories', 'categories');
    queryBuilder.leftJoinAndSelect(
      'voucher.allow_combine_categories',
      'allow_combine_categories',
    );
    queryBuilder.leftJoinAndSelect('voucher.target_users', 'target_users');

    if (search) {
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
      relations: ['categories', 'allow_combine_categories', 'target_users'],
    });
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
  ): Promise<VoucherEntity> {
    const voucher = await this.repository.findOne({
      where: { code: id },
      relations: ['categories', 'allow_combine_categories', 'target_users'],
    });

    if (!voucher) {
      throw new NotFoundException(`Voucher with code ${id} not found.`);
    }

    const {
      target_users,
      categories,
      allow_combine_categories,
      ...scalarFields
    } = updateVoucherDto;

    if (target_users !== undefined) {
      voucher.target_users = await this.getOrCreateLoyaltyUsers(target_users);
    }

    if (categories && categories.length > 0) {
      voucher.categories = await this.voucherCategoryRepository.findBy({
        slug: In(categories.map((c) => c.slug)),
      });
    }

    if (allow_combine_categories && allow_combine_categories.length > 0) {
      voucher.allow_combine_categories =
        await this.voucherCategoryRepository.findBy({
          slug: In(allow_combine_categories.map((c) => c.slug)),
        });
    }

    Object.assign(voucher, scalarFields);
    return this.repository.save(voucher);
  }

  private async getOrCreateLoyaltyUsers(
    coreUserIds: string[],
  ): Promise<LoyaltyUserEntity[]> {
    if (!coreUserIds || coreUserIds.length === 0) return [];

    const existingUsers = await this.userRepository.findBy({
      core_user_id: In(coreUserIds),
    });

    const existingCoreUserIds = existingUsers.map((u) => u.core_user_id);
    const missingCoreUserIds = coreUserIds.filter(
      (id) => !existingCoreUserIds.includes(id),
    );

    if (missingCoreUserIds.length > 0) {
      const newUsers = missingCoreUserIds.map((id) => {
        const user = new LoyaltyUserEntity();
        user.core_user_id = id;
        return user;
      });
      const savedUsers = await this.userRepository.save(newUsers);
      return [...existingUsers, ...savedUsers];
    }

    return existingUsers;
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
