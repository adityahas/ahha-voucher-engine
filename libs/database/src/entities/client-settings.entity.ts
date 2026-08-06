import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('client_settings', { synchronize: false })
export class ClientSettingsEntity {
  @PrimaryColumn()
  client_database_name: string;

  @Column({ type: 'varchar', length: 3, default: 'IDR' })
  currency_code: string;

  @Column({ type: 'varchar', length: 35, default: 'id-ID' })
  locale: string;

  @Column({ type: 'jsonb', default: {} })
  number_format_options: Intl.NumberFormatOptions;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 3,
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 3,
  })
  updated_at: Date;
}
