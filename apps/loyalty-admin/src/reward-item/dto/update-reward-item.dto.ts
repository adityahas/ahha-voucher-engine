import { PartialType } from '@nestjs/mapped-types';
import { CreateRewardItemDto } from './create-reward-item.dto';

export class UpdateRewardItemDto extends PartialType(CreateRewardItemDto) {}
