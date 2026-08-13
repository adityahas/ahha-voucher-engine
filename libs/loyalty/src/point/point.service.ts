import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LoyaltyUserEntity } from '../entities/loyalty-user.entity';
import {
  PointLedgerEntity,
  PointEventType,
} from './entities/point-ledger.entity';
import {
  TierHistoryEntity,
  TierChangeReason,
} from './entities/tier-history.entity';
import { LoyaltyTierEntity } from '../tier/entities/loyalty-tier.entity';

@Injectable()
export class PointService {
  async earn(
    user: LoyaltyUserEntity,
    amount: number,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
  ): Promise<number> {
    const balance = Number(user.balance_points) + amount;
    user.lifetime_points = Number(user.lifetime_points) + amount;
    user.balance_points = balance;
    await this.writeLedger(
      user,
      PointEventType.EARN,
      amount,
      balance,
      referenceType,
      referenceId,
      manager,
    );
    await manager.getRepository(LoyaltyUserEntity).save(user);
    return balance;
  }

  async spend(
    user: LoyaltyUserEntity,
    amount: number,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
  ): Promise<number> {
    if (Number(user.balance_points) < amount) {
      throw new BadRequestException('Insufficient points');
    }
    const balance = Number(user.balance_points) - amount;
    user.balance_points = balance;
    await this.writeLedger(
      user,
      PointEventType.SPEND,
      -amount,
      balance,
      referenceType,
      referenceId,
      manager,
    );
    await manager.getRepository(LoyaltyUserEntity).save(user);
    return balance;
  }

  async rollback(
    user: LoyaltyUserEntity,
    amount: number,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
  ): Promise<number> {
    const balance = Number(user.balance_points);
    await this.writeLedger(
      user,
      PointEventType.ROLLBACK,
      amount,
      balance,
      referenceType,
      referenceId,
      manager,
    );
    return balance;
  }

  async adjust(
    user: LoyaltyUserEntity,
    delta: number,
    referenceId: string,
    manager: EntityManager,
  ): Promise<number> {
    const balance = Number(user.balance_points) + delta;
    if (balance < 0) {
      throw new BadRequestException('Insufficient points');
    }
    user.balance_points = balance;
    await this.writeLedger(
      user,
      PointEventType.ADJUSTMENT,
      delta,
      balance,
      'MANUAL_ADJUSTMENT',
      referenceId,
      manager,
    );
    await manager.getRepository(LoyaltyUserEntity).save(user);
    return balance;
  }

  async recordTierChange(
    user: LoyaltyUserEntity,
    fromTier: LoyaltyTierEntity | null,
    toTier: LoyaltyTierEntity,
    reason: TierChangeReason,
    manager: EntityManager,
  ): Promise<void> {
    const history = manager
      .getRepository(TierHistoryEntity)
      .create({ user, from_tier: fromTier, to_tier: toTier, reason });
    await manager.getRepository(TierHistoryEntity).save(history);
  }

  private async writeLedger(
    user: LoyaltyUserEntity,
    eventType: PointEventType,
    amount: number,
    balanceAfter: number,
    referenceType: string,
    referenceId: string,
    manager: EntityManager,
  ): Promise<void> {
    const entry = manager.getRepository(PointLedgerEntity).create({
      user,
      event_type: eventType,
      amount,
      balance_after: balanceAfter,
      reference_type: referenceType,
      reference_id: referenceId,
    });
    await manager.getRepository(PointLedgerEntity).save(entry);
  }
}
