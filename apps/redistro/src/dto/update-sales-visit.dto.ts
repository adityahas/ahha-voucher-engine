import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesVisitDto } from './create-sales-visit.dto';

export class UpdateSalesVisitDto extends PartialType(CreateSalesVisitDto) {}
