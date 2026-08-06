import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { PurchaseConsumerService } from './purchase-consumer.service';
import { ConsumerProductPurchaseDto } from './dto/consumer-product-purchase.dto';

@ApiTags('Purchase')
@ApiBearerAuth()
@Controller('purchase')
@UseGuards(ConsumerJwtGuard)
export class PurchaseConsumerController {
  constructor(private readonly purchaseService: PurchaseConsumerService) {}

  @Post()
  @ApiOperation({ summary: 'Execute product purchase transaction' })
  @ApiResponse({ status: 201, description: 'Purchase completed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid payload or voucher error',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async purchase(
    @Req() req: any,
    @Body() dto: ConsumerProductPurchaseDto,
  ): Promise<any> {
    return this.purchaseService.executePurchase(dto, req);
  }
}
