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

@Controller('/loyalty/purchase')
@UseGuards(ConsumerJwtGuard)
export class PurchaseController {
  constructor(
    @Inject('VOUCHER_SERVICE') private readonly voucherService: VoucherService,
    private readonly orderService: OrderService,
    @Inject('LOYALTY_CONSUMER_CONNECTION')
    private readonly dataSource: DataSource,
  ) {}

  @Post()
  async purchase(
    @Req() req: any,
    @Body() dto: CreatePurchaseDto,
  ): Promise<OrderEntity> {
    const userId = req.user.core_user_id;

    return this.dataSource.transaction(async (manager) => {
      // 1. Fetch Product
      const product = await manager.findOne(ProductEntity, {
        where: { id: dto.product_id, is_active: true },
      });

      if (!product) {
        throw new NotFoundException('Product not found or inactive');
      }

      // 2. Calculate Subtotal
      const subtotal = product.price * dto.quantity;
      let discountAmount = 0;
      let finalPrice = subtotal;

      // 3. Optional Voucher Usage & Calculation
      if (dto.voucher_code) {
        // Fetch product components (categories) for binding validation
        const productWithCategories = await manager.findOne(ProductEntity, {
          where: { id: dto.product_id },
          relations: ['categories'],
        });

        const categoryNames =
          productWithCategories?.categories?.map((c) => c.name) || [];

        const calculation =
          await this.voucherService.validateAndCalculateDiscount(
            dto.voucher_code,
            subtotal,
            userId,
            product.id,
            categoryNames,
          );

        if (!calculation.isValid) {
          throw new BadRequestException(calculation.message);
        }

        discountAmount = calculation.discountAmount;
        finalPrice = calculation.finalPrice;

        // Mark voucher as used within the transaction
        await this.voucherService.useVoucher(userId, dto.voucher_code, manager);
      }

      // 4. Create Order with breakdown
      const order = await this.orderService.create({
        user_id: userId,
        product_id: product.id,
        quantity: dto.quantity,
        subtotal: Number(subtotal),
        discount_amount: Number(discountAmount),
        total_price: Number(finalPrice),
        voucher_code: dto.voucher_code || null,
      });

      return order;
    });
  }
}
