import { VoucherCategoryEntity } from '@core/loyalty/voucher/entities/voucher-category.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ResponseVoucherCategoryDto extends VoucherCategoryEntity {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Deleted timestamp' })
  deletedAt?: Date;
}
