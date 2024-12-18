import { Entity } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('admin_users')
export class AdminUser extends User {}
