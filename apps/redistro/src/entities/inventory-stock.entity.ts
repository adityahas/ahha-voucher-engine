import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { RedistroProductEntity } from './redistro-product.entity';
import { WarehouseEntity } from '../warehouse/entities/warehouse.entity';

@Entity('inventory_stocks')
export class InventoryStock extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RedistroProductEntity)
  @JoinColumn({ name: 'product_id' })
  rds_product: RedistroProductEntity;

  @Column({ type: 'uuid' })
  product_id: string;

  @ManyToOne(() => WarehouseEntity)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: WarehouseEntity;

  @Column({ type: 'uuid' })
  warehouse_id: string;

  @Column({ type: 'int' })
  quantity: number;
}
