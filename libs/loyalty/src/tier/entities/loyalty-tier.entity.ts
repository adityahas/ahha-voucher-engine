import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { TierCategoryOverrideEntity } from './tier-category-override.entity';

@Entity('loyalty_tiers')
export class LoyaltyTierEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int' })
  level: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  min_points: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
  point_multiplier: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  extra_discount_percent: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  exclusive_window_hours: number;

  @Column({ type: 'varchar', nullable: true })
  level_up_voucher_code: string | null;

  @OneToMany(() => TierCategoryOverrideEntity, (o) => o.tier, {
    cascade: true,
  })
  category_overrides: TierCategoryOverrideEntity[];
}
