import {
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { VoucherService } from './voucher.service';
import { OrderService } from '@core/product/order.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { DataSource } from 'typeorm';
import { ProductEntity } from '@core/product/entities/product.entity';
import { OrderEntity } from '@core/product/entities/order.entity';

@Controller('purchase')
@UseGuards(ConsumerJwtGuard)
export class PurchaseController {
  constructor(
    @Inject('VOUCHER_SERVICE') private readonly voucherService: VoucherService,
    private readonly orderService: OrderService,
    @Inject('LOYALTY_CONSUMER_CONNECTION') private readonly dataSource: DataSource,
  ) {}

  @Post()
  async purchase(@Req() req: any, @Body() dto: CreatePurchaseDto): Promise<OrderEntity> {
    const userId = req.user.core_user_id;

    return this.dataSource.transaction(async (manager) => {
      // 1. Fetch Product
      const product = await manager.findOne(ProductEntity, {
        where: { id: dto.product_id, is_active: true },
        lock: { mode: 'pessimistic_read' },
      });

      if (!product) {
        throw new NotFoundException('Product not found or inactive');
      }

      // 2. Calculate Total Price (Simplified: no discount logic yet)
      const totalPrice = product.price * dto.quantity;

      // 3. Optional Voucher Usage
      if (dto.voucher_code) {
        await this.voucherService.useVoucher(userId, dto.voucher_code, manager);
      }

      // 4. Create Order
      const order = await this.orderService.create({
        user_id: userId,
        product_id: product.id,
        quantity: dto.quantity,
        total_price: totalPrice,
        voucher_code: dto.voucher_code || null,
      });

      return order;
    });
  }
}
