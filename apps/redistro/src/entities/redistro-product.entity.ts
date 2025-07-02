import { Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '@core/product/entities/product.entity';

@Entity('rds_products')
export class RedistroProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Product, { cascade: true })
  product: Product;
}
