import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RewardItemSourceEntity } from '../../reward-item-source/entities/reward-item-source.entity';

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
}
