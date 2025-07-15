import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { Role } from '@core/auth/roles.enum';
import { Client } from '@core/database/entities/client.entity';

@Entity('admins')
export class AdminEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.ADMIN,
  })
  role: Role;

  @ManyToOne(() => Client)
  @JoinColumn({
    name: 'client_database_name',
    referencedColumnName: 'database_name',
  })
  client: Client;
}
