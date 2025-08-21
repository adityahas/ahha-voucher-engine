import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { RedistroUserEntity } from '../../entities/redistro-user.entity';

@Entity('warehouses')
export class WarehouseEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => RedistroUserEntity, { cascade: true })
  rds_user: RedistroUserEntity;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true }) // GEOMETRY type, using varchar for now
  location: string;
}
