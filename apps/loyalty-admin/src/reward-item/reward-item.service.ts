import { Injectable } from '@nestjs/common';
import { CreateRewardItemDto } from './dto/create-reward-item.dto';
import { UpdateRewardItemDto } from './dto/update-reward-item.dto';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { DataSource, Repository } from 'typeorm';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Injectable()
export class RewardItemService {
  private rewardItemRepository: Repository<RewardItemEntity>;

  constructor(dataSource: DataSource) {
    this.rewardItemRepository = dataSource.getRepository(RewardItemEntity);
  }

  async create(
    createRewardItemDto: CreateRewardItemDto,
  ): Promise<RewardItemEntity> {
    const newRewardItem = this.rewardItemRepository.create(createRewardItemDto);
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
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async findOne(id: string): Promise<RewardItemEntity> {
    return this.rewardItemRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    updateRewardItemDto: UpdateRewardItemDto,
  ): Promise<RewardItemEntity> {
    await this.rewardItemRepository.update(id, updateRewardItemDto);
    return this.rewardItemRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.rewardItemRepository.delete(id);
  }
}
