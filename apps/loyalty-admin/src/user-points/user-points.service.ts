import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { PointLedgerEntity } from '@core/loyalty/point/entities/point-ledger.entity';
import { PointService } from '@core/loyalty/point/point.service';

@Injectable()
export class UserPointsService {
  private userRepository: Repository<LoyaltyUserEntity>;
  private ledgerRepository: Repository<PointLedgerEntity>;

  constructor(
    private dataSource: DataSource,
    private pointService: PointService,
  ) {
    this.userRepository = dataSource.getRepository(LoyaltyUserEntity);
    this.ledgerRepository = dataSource.getRepository(PointLedgerEntity);
  }

  async getProfile(coreUserId: string) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
      relations: ['tier'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getLedger(coreUserId: string, page = 0, size = 10) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
    });
    if (!user) throw new NotFoundException('User not found');
    const [data, total] = await this.ledgerRepository.findAndCount({
      where: { user: { id: user.id } },
      order: { occurred_at: 'DESC' },
      skip: page * size,
      take: size,
    });
    return {
      code: 'SUCCESS',
      message: 'Point history retrieved successfully',
      data,
      pagination: { page, size, total },
    };
  }

  async adjustPoints(coreUserId: string, delta: number, reason: string) {
    const user = await this.userRepository.findOne({
      where: { core_user_id: coreUserId },
      relations: ['tier'],
    });
    if (!user) throw new NotFoundException('User not found');
    return this.dataSource.transaction(async (manager) => {
      const balance = await this.pointService.adjust(
        user,
        delta,
        reason,
        manager,
      );
      return { balance_points: balance };
    });
  }
}
