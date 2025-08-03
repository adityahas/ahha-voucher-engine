import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';

@Entity('reward_items')
export class RewardItemEntity {
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

  @Column({ default: -1 }) // -1 for unlimited stock, 0 for out of stock, >0 for limited stock
  stock: number;
}
