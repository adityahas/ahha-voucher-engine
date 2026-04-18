import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { ProductCategoryEntity } from './product-category.entity';

@Entity('products')
export class ProductEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  sku: string;

  @Column({ type: 'varchar' })
  name: string;

  @ManyToMany(() => ProductCategoryEntity, { eager: true, cascade: true })
  @JoinTable({ name: 'products_categories' })
  categories: ProductCategoryEntity[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'varchar' })
  unit: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'text', nullable: true })
  image_url: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
