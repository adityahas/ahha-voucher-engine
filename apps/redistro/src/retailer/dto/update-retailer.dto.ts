import { PartialType } from '@nestjs/mapped-types';
import { CreateRetailerDto } from './create-retailer.dto';

export class UpdateRetailerDto extends PartialType(CreateRetailerDto) {}
