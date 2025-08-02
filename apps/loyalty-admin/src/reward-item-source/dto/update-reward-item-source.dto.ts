import { PartialType } from '@nestjs/mapped-types';
import { CreateRewardItemSourceDto } from './create-reward-item-source.dto';

export class UpdateRewardItemSourceDto extends PartialType(
  CreateRewardItemSourceDto,
) {}
