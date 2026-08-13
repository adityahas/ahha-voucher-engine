import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';
import { LoyaltyTierEntity } from '../../tier/entities/loyalty-tier.entity';
import { BaseEntity } from '@core/base/entities/base.entity';

@Entity('reward_items')
export class RewardItemEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  source_id: string;

  @ManyToOne(() => RewardItemSourceEntity)
  @JoinColumn({ name: 'source_id' })
  source: RewardItemSourceEntity;

  @Column()
  type: string; // e.g. 'gopay', 'pulsa', etc.

  @Column({ default: -1 }) // -1 unlimited, 0 out, >0 limited
  stock: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  point_price: number;

  // Exclusive claim window semantics: the `min_tier` gate is enforced ONLY while
  // `exclusive_days > 0` and the window has not elapsed (reward exclusive to that
  // tier during the window, then open to everyone). Setting `min_tier` with
  // `exclusive_days: 0` (or elapsed) DISABLES the tier gate entirely — configure
  // `exclusive_days` if a tier restriction is intended.
  @ManyToOne(() => LoyaltyTierEntity, { nullable: true })
  @JoinColumn({ name: 'min_tier_id' })
  min_tier: LoyaltyTierEntity | null;

  @Column({ type: 'int', default: 0 })
  exclusive_days: number;
}
