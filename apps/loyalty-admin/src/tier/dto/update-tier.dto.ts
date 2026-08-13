import { PartialType } from '@nestjs/mapped-types';
import { CreateTierDto } from './create-tier.dto';

export class UpdateTierDto extends PartialType(CreateTierDto) {}
