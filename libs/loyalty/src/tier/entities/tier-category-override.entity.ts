import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { LoyaltyTierEntity } from './loyalty-tier.entity';
import { ProductCategoryEntity } from '@core/product/entities/product-category.entity';

@Entity('loyalty_tier_category_overrides')
export class TierCategoryOverrideEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoyaltyTierEntity, (tier) => tier.category_overrides)
  @JoinColumn({ name: 'tier_id' })
  tier: LoyaltyTierEntity;

  @ManyToOne(() => ProductCategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category: ProductCategoryEntity;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
  point_multiplier: number;
}
