import { Injectable } from '@nestjs/common';
import { CreateQuestDto } from './dto/create-quest.dto';
import { UpdateQuestDto } from './dto/update-quest.dto';
import { DataSource, Repository } from 'typeorm';
import { QuestEntity } from '@core/loyalty/quest/entities/quest.entity';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';
import { BasePaginationResponseInterface } from '@core/base/dto/base-response.interface';

@Injectable()
export class QuestService {
  private repository: Repository<QuestEntity>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(QuestEntity);
  }

  create(_createQuestDto: CreateQuestDto) {
    return 'This action adds a new quest';
  }

  async findAll(
    paginationDto: BasePaginationDto,
  ): Promise<BasePaginationResponseInterface<QuestEntity>> {
    const { page, size, search, sort, order } = paginationDto;
    const skip = page * size;

    const queryBuilder = this.repository.createQueryBuilder('quest');

    if (search) {
      queryBuilder.where('quest.name ILIKE :search', { search: `%${search}%` });
    }

    if (sort && order) {
      queryBuilder.orderBy(`quest.${sort}`, order);
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return {
      code: 'SUCCESS',
      message: 'Quests retrieved successfully',
      data,
      pagination: {
        page,
        size,
        total,
      },
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} quest`;
  }

  update(id: number, _updateQuestDto: UpdateQuestDto) {
    return `This action updates a #${id} quest`;
  }

  remove(id: number) {
    return `This action removes a #${id} quest`;
  }
}
