import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../base/entities/base.entity';
import { Client } from '../../client/entities/client.entity';
import { Role } from '../../acl/role.entity';

@Entity('admins')
export class Admin extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @ManyToOne(() => Client)
  @JoinColumn({
    name: 'client_database_name',
    referencedColumnName: 'database_name',
  })
  client: Client;

  @ManyToOne(() => Role, (role) => role.admins, { eager: true })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: Role;
}
