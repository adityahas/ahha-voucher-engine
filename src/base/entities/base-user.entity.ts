import { JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { BaseEntity } from './base.entity';

export class UserBaseEntity extends BaseEntity {
  @ManyToOne(() => User, (userBaseEntity) => userBaseEntity.id)
  @JoinColumn({ name: 'created_by_id', referencedColumnName: 'id' })
  created_by: UserBaseEntity;
}
