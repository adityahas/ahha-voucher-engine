import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { TierCategoryOverrideEntity } from '@core/loyalty/tier/entities/tier-category-override.entity';
import { ProductCategoryEntity } from '@core/product/entities/product-category.entity';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

const SORTABLE_COLUMNS = new Set([
  'name',
  'level',
  'min_points',
  'point_multiplier',
  'extra_discount_percent',
  'is_active',
  'created_at',
  'updated_at',
]);

@Injectable()
export class TierAdminService {
  private tierRepository: Repository<LoyaltyTierEntity>;
  private overrideRepository: Repository<TierCategoryOverrideEntity>;
  private categoryRepository: Repository<ProductCategoryEntity>;

  constructor(dataSource: DataSource) {
    this.tierRepository = dataSource.getRepository(LoyaltyTierEntity);
    this.overrideRepository = dataSource.getRepository(
      TierCategoryOverrideEntity,
    );
    this.categoryRepository = dataSource.getRepository(ProductCategoryEntity);
  }

  async create(dto: CreateTierDto): Promise<LoyaltyTierEntity> {
    const { category_overrides, ...tierData } = dto;
    const tier = this.tierRepository.create(tierData);
    await this.tierRepository.save(tier);

    if (category_overrides && category_overrides.length > 0) {
      for (const o of category_overrides) {
        const category = await this.categoryRepository.findOne({
          where: { id: o.category_id },
        });
        if (!category) continue;
        const override = this.overrideRepository.create({
          tier,
          category,
          point_multiplier: o.point_multiplier,
        });
        await this.overrideRepository.save(override);
      }
    }
    return tier;
  }

  async findAll(
    paginationDto: BasePaginationDto,
  ): Promise<BasePaginationResponseInterface<LoyaltyTierEntity>> {
    const { page, size, search, sort, order } = paginationDto;
    const skip = page * size;
    const qb = this.tierRepository
      .createQueryBuilder('tier')
      .leftJoinAndSelect('tier.category_overrides', 'override')
      .leftJoinAndSelect('override.category', 'category');

    if (search) {
      qb.where('tier.name ILIKE :search', { search: `%${search}%` });
    }
    if (sort && order) {
      const sortColumn = SORTABLE_COLUMNS.has(sort) ? sort : 'created_at';
      const orderDir = order === 'DESC' ? 'DESC' : 'ASC';
      qb.orderBy(`tier.${sortColumn}`, orderDir);
    }
    const [data, total] = await qb.skip(skip).take(size).getManyAndCount();
    return {
      code: 'SUCCESS',
      message: 'Tiers retrieved successfully',
      data,
      pagination: { page, size, total },
    };
  }

  async findOne(id: string): Promise<LoyaltyTierEntity> {
    const tier = await this.tierRepository.findOne({
      where: { id },
      relations: ['category_overrides', 'category_overrides.category'],
    });
    if (!tier) throw new NotFoundException(`Tier with id ${id} not found`);
    return tier;
  }

  async update(id: string, dto: UpdateTierDto): Promise<LoyaltyTierEntity> {
    const tier = await this.findOne(id);
    const { category_overrides, ...tierData } = dto;
    Object.assign(tier, tierData);
    await this.tierRepository.save(tier);

    if (category_overrides) {
      await this.overrideRepository.delete({ tier: { id } });
      for (const o of category_overrides) {
        const category = await this.categoryRepository.findOne({
          where: { id: o.category_id },
        });
        if (!category) continue;
        const override = this.overrideRepository.create({
          tier,
          category,
          point_multiplier: o.point_multiplier,
        });
        await this.overrideRepository.save(override);
      }
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.tierRepository.softDelete(id);
  }
}
