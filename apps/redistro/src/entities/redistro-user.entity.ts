import { Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@core/user/entities/user.entity';

@Entity('rds_users')
export class RedistroUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true })
  user: User;
}
