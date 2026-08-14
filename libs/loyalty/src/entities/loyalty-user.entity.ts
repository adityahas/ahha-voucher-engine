import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LoyaltyTierEntity } from '../tier/entities/loyalty-tier.entity';

@Entity('loyalty_users')
export class LoyaltyUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  core_user_id: string;

  @ManyToOne(() => LoyaltyTierEntity, { nullable: true })
  @JoinColumn({ name: 'tier_id' })
  tier: LoyaltyTierEntity | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lifetime_points: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance_points: number;

  @Column({ type: 'varchar', nullable: true, default: 'Asia/Jakarta' })
  timezone: string;
}
