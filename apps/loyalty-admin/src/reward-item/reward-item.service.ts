import { Injectable } from '@nestjs/common';
import { CreateRewardItemDto } from './dto/create-reward-item.dto';
import { UpdateRewardItemDto } from './dto/update-reward-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RewardItemService {
  constructor(
    @InjectRepository(RewardItemEntity)
    private rewardItemRepository: Repository<RewardItemEntity>,
  ) {}

  async create(
    createRewardItemDto: CreateRewardItemDto,
  ): Promise<RewardItemEntity> {
    const newRewardItem = this.rewardItemRepository.create(createRewardItemDto);
    return this.rewardItemRepository.save(newRewardItem);
  }

  async findAll(): Promise<RewardItemEntity[]> {
    return this.rewardItemRepository.find();
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
