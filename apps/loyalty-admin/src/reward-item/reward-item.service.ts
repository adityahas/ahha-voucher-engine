import { Injectable } from '@nestjs/common';
import { CreateRewardItemDto } from './dto/create-reward-item.dto';
import { UpdateRewardItemDto } from './dto/update-reward-item.dto';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { DataSource, Repository } from 'typeorm';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Injectable()
export class RewardItemService {
  private rewardItemRepository: Repository<RewardItemEntity>;
  private tierRepository: Repository<LoyaltyTierEntity>;

  constructor(dataSource: DataSource) {
    this.rewardItemRepository = dataSource.getRepository(RewardItemEntity);
    this.tierRepository = dataSource.getRepository(LoyaltyTierEntity);
  }

  async create(dto: CreateRewardItemDto): Promise<RewardItemEntity> {
    const { min_tier_id, ...rest } = dto;
    const min_tier = min_tier_id
      ? await this.tierRepository.findOne({ where: { id: min_tier_id } })
      : null;
    const newRewardItem = this.rewardItemRepository.create({
      ...rest,
      ...(min_tier ? { min_tier } : {}),
    });
    return this.rewardItemRepository.save(newRewardItem);
  }

  async findAll(
    paginationDto: BasePaginationDto,
  ): Promise<BasePaginationResponseInterface<RewardItemEntity>> {
    const { page, size, search, sort, order } = paginationDto;
    const skip = page * size;
    const queryBuilder =
      this.rewardItemRepository.createQueryBuilder('rewardItem');

    if (search) {
      queryBuilder.where('rewardItem.name ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (sort && order) {
      queryBuilder.orderBy(`rewardItem.${sort}`, order);
    }
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .getManyAndCount();
    return {
      code: 'SUCCESS',
      message: 'Reward items retrieved successfully',
      data,
      pagination: { page, size, total },
    };
  }

  async findOne(id: string): Promise<RewardItemEntity> {
    return this.rewardItemRepository.findOne({
      where: { id },
      relations: ['source', 'min_tier'],
    });
  }

  async update(
    id: string,
    updateRewardItemDto: UpdateRewardItemDto,
  ): Promise<RewardItemEntity> {
    const { min_tier_id, ...rest } = updateRewardItemDto;
    const payload: Partial<RewardItemEntity> = { ...rest } as any;
    if (min_tier_id !== undefined) {
      payload.min_tier = min_tier_id
        ? await this.tierRepository.findOne({ where: { id: min_tier_id } })
        : null;
    }
    await this.rewardItemRepository.update(id, payload as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.rewardItemRepository.delete(id);
  }
}
