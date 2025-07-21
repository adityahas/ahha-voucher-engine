import { Injectable } from '@nestjs/common';
import { CreateRewardItemSourceDto } from './dto/create-reward-item-source.dto';
import { UpdateRewardItemSourceDto } from './dto/update-reward-item-source.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RewardItemSourceEntity } from './entities/reward-item-source.entity';
import { Repository } from 'typeorm';

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

  async findAll(): Promise<RewardItemSourceEntity[]> {
    return this.rewardItemSourceRepository.find();
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
