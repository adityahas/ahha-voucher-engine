import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { LoyaltyUserEntity } from '../../entities/loyalty-user.entity';
import { LoyaltyTierEntity } from '../../tier/entities/loyalty-tier.entity';

export enum TierChangeReason {
  POINTS_THRESHOLD = 'POINTS_THRESHOLD',
  MANUAL = 'MANUAL',
}

@Entity('tier_history')
export class TierHistoryEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoyaltyUserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: LoyaltyUserEntity;

  @ManyToOne(() => LoyaltyTierEntity, { nullable: true })
  @JoinColumn({ name: 'from_tier_id' })
  from_tier: LoyaltyTierEntity | null;

  @ManyToOne(() => LoyaltyTierEntity, { nullable: false })
  @JoinColumn({ name: 'to_tier_id' })
  to_tier: LoyaltyTierEntity;

  @Column({ type: 'varchar' })
  reason: TierChangeReason;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  changed_at: Date;
}
