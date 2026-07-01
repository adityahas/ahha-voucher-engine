import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { RetailerEntity } from '../retailer/entities/retailer.entity';

@Entity('sales_visits')
export class SalesVisit extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RetailerEntity)
  @JoinColumn({ name: 'retailer_id' })
  retailer: RetailerEntity;

  @Column({ type: 'uuid' })
  retailer_id: string;

  @Column({ type: 'uuid', nullable: true })
  sales_person_id: string;

  @Column({ type: 'timestamptz', nullable: true })
  visit_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
