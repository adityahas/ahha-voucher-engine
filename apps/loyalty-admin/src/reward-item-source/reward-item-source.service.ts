import { Injectable } from '@nestjs/common';
import { CreateRewardItemSourceDto } from './dto/create-reward-item-source.dto';
import { UpdateRewardItemSourceDto } from './dto/update-reward-item-source.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';
import { Repository } from 'typeorm';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Injectable()
export class RewardItemSourceService {
  constructor(
    @InjectRepository(RewardItemSourceEntity)
    private rewardItemSourceRepository: Repository<RewardItemSourceEntity>,
  ) {}

  async create(
    createRewardItemSourceDto: CreateRewardItemSourceDto,
  ): Promise<RewardItemSourceEntity> {
    const newRewardItemSource = this.rewardItemSourceRepository.create(
      createRewardItemSourceDto,
    );
    return this.rewardItemSourceRepository.save(newRewardItemSource);
  }

  async findAll(
    paginationDto: BasePaginationDto,
  ): Promise<BasePaginationResponseInterface<RewardItemSourceEntity>> {
    const { page, size, search, sort, order } = paginationDto;
    const skip = page * size;

    const queryBuilder =
      this.rewardItemSourceRepository.createQueryBuilder('rewardItemSource');

    if (search) {
      queryBuilder.where('rewardItemSource.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (sort && order) {
      queryBuilder.orderBy(`rewardItemSource.${sort}`, order);
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return {
      code: 'SUCCESS',
      message: 'Reward item sources retrieved successfully',
      data,
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async findOne(id: string): Promise<RewardItemSourceEntity> {
    return this.rewardItemSourceRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    updateRewardItemSourceDto: UpdateRewardItemSourceDto,
  ): Promise<RewardItemSourceEntity> {
    await this.rewardItemSourceRepository.update(id, updateRewardItemSourceDto);
    return this.rewardItemSourceRepository.findOne({ where: { id } });
  }

  async remove(id: number): Promise<void> {
    await this.rewardItemSourceRepository.delete(id);
  }
}
