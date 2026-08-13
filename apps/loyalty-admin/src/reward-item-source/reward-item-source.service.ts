import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRewardItemSourceDto } from './dto/create-reward-item-source.dto';
import { UpdateRewardItemSourceDto } from './dto/update-reward-item-source.dto';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';
import { DataSource, Repository } from 'typeorm';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Injectable()
export class RewardItemSourceService {
  private rewardItemSourceRepository: Repository<RewardItemSourceEntity>;

  constructor(dataSource: DataSource) {
    this.rewardItemSourceRepository = dataSource.getRepository(
      RewardItemSourceEntity,
    );
  }

  async create(
    createRewardItemSourceDto: CreateRewardItemSourceDto,
  ): Promise<RewardItemSourceEntity> {
    const newRewardItemSource = this.rewardItemSourceRepository.create(
      this.normalizeInput(createRewardItemSourceDto),
    );
    const saved =
      await this.rewardItemSourceRepository.save(newRewardItemSource);
    return this.maskEntity(saved);
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

    const sortableFields = new Set([
      'id',
      'name',
      'source_type',
      'api_endpoint',
    ]);
    if (sort && order && sortableFields.has(sort)) {
      queryBuilder.orderBy(`rewardItemSource.${sort}`, order);
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return {
      code: 'SUCCESS',
      message: 'Reward item sources retrieved successfully',
      data: data.map((item) => this.maskEntity(item)),
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  async findOne(id: string): Promise<RewardItemSourceEntity> {
    const entity = await this.rewardItemSourceRepository.findOne({
      where: { id },
    });
    return entity && this.maskEntity(entity);
  }

  async update(
    id: string,
    updateRewardItemSourceDto: UpdateRewardItemSourceDto,
  ): Promise<RewardItemSourceEntity> {
    const result = await this.rewardItemSourceRepository.update(
      id,
      this.normalizeInput(updateRewardItemSourceDto),
    );
    if (!result.affected) {
      throw new NotFoundException(`Reward item source ${id} not found.`);
    }
    const entity = await this.rewardItemSourceRepository.findOne({
      where: { id },
    });
    return entity && this.maskEntity(entity);
  }

  async remove(id: string): Promise<void> {
    const result = await this.rewardItemSourceRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Reward item source ${id} not found.`);
    }
  }

  private normalizeInput(
    input: CreateRewardItemSourceDto | UpdateRewardItemSourceDto,
  ) {
    return {
      ...input,
      ...(Object.prototype.hasOwnProperty.call(input, 'apiKey') && {
        apiKey: input.apiKey?.trim() || null,
      }),
    };
  }

  private maskEntity(entity: RewardItemSourceEntity): RewardItemSourceEntity {
    return { ...entity, apiKey: this.maskApiKey(entity.apiKey) };
  }

  private maskApiKey(value: string | null): string | null {
    if (!value) return null;
    if (value.length <= 6) return '***';
    return `${value.slice(0, 3)}***${value.slice(-3)}`;
  }
}
