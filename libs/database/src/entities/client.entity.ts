import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';

@Entity('clients', { synchronize: false })
export class ClientEntity extends BaseEntity {
  @Column({ unique: true })
  subdomain: string;

  @Column()
  api_key: string;

  @PrimaryColumn()
  database_name: string;

  @Column()
  database_username: string;

  @Column()
  database_password: string;

  @Column()
  database_port: string;

  @Column()
  database_host: string;
}
