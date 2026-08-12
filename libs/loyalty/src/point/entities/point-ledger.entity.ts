import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { LoyaltyUserEntity } from '../../entities/loyalty-user.entity';

export enum PointEventType {
  EARN = 'EARN',
  SPEND = 'SPEND',
  ROLLBACK = 'ROLLBACK',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('point_ledger')
export class PointLedgerEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoyaltyUserEntity, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: LoyaltyUserEntity;

  @Column({ type: 'varchar' })
  event_type: PointEventType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balance_after: number;

  @Column({ type: 'varchar', nullable: true })
  reference_type: string;

  @Column({ type: 'varchar', nullable: true })
  reference_id: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  occurred_at: Date;
}
