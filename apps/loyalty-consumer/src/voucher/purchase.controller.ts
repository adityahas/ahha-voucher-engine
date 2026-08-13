import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';
import { VoucherService } from './voucher.service';
import { OrderService } from '@core/product/order.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { DataSource, EntityManager } from 'typeorm';
import { ProductEntity } from '@core/product/entities/product.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { TierService } from '@core/loyalty/tier/tier.service';
import { PointService } from '@core/loyalty/point/point.service';
import { TierChangeReason } from '@core/loyalty/point/entities/tier-history.entity';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { computeTierDiscountAndPoints } from './discount-points.util';

@Controller('/loyalty/purchase')
@UseGuards(ConsumerJwtGuard)
export class PurchaseController {
  constructor(
    @Inject('VOUCHER_SERVICE') private readonly voucherService: VoucherService,
    private readonly orderService: OrderService,
    @Inject('LOYALTY_CONSUMER_CONNECTION')
    private readonly dataSource: DataSource,
    private readonly tierService: TierService,
    private readonly pointService: PointService,
    private readonly settingsService: ClientSettingsService,
  ) {}

  @Post()
  async purchase(
    @Req() req: any,
    @Body() dto: CreatePurchaseDto,
  ): Promise<any> {
    const userId = req.user['userId'];
    const databaseName = req['client'].database_name;

    return this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(ProductEntity, {
        where: { id: dto.product_id, is_active: true },
      });
      if (!product) {
        throw new NotFoundException('Product not found or inactive');
      }

      const subtotal = Number(product.price) * dto.quantity;
      let voucherDiscount = 0;

      if (dto.voucher_code) {
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
        voucherDiscount = calculation.discountAmount;
        await this.voucherService.useVoucher(userId, dto.voucher_code, manager);
      }

      let user = await manager.getRepository(LoyaltyUserEntity).findOne({
        where: { core_user_id: userId },
        relations: ['tier'],
      });
      if (!user) {
        user = manager
          .getRepository(LoyaltyUserEntity)
          .create({ core_user_id: userId });
        user.tier = await this.tierService.findLowestActiveTier(manager);
        user.lifetime_points = 0;
        user.balance_points = 0;
        user = await manager.getRepository(LoyaltyUserEntity).save(user);
      }

      const tier: LoyaltyTierEntity | null = user.tier || null;
      const tierExtraPercent = tier ? Number(tier.extra_discount_percent) : 0;

      const settings =
        await this.settingsService.getLoyaltySettings(databaseName);

      const productWithCategories = await manager.findOne(ProductEntity, {
        where: { id: dto.product_id },
        relations: ['categories'],
      });
      const categoryNames =
        productWithCategories?.categories?.map((c) => c.name) || [];

      const multiplier = tier
        ? await this.tierService.getMultiplierFor(tier, categoryNames, manager)
        : 1;

      const calc = computeTierDiscountAndPoints({
        subtotal,
        voucherDiscount,
        tierExtraPercent,
        maxCombinedPercent: Number(settings.max_combined_discount_percent),
        pointBaseRate: Number(settings.point_base_rate),
        multiplier,
      });

      const order = await this.orderService.create({
        user_id: userId,
        product_id: product.id,
        quantity: dto.quantity,
        subtotal: Number(subtotal),
        discount_amount: Number(calc.combined_discount),
        total_price: Number(calc.final_price),
        voucher_code: dto.voucher_code || null,
      });

      const pointsEarned = calc.points_earned;
      if (pointsEarned > 0) {
        await this.pointService.earn(
          user,
          pointsEarned,
          'ORDER',
          order.id,
          manager,
        );
        await this.maybeLevelUp(user, manager);
      }

      return {
        ...order,
        points_earned: pointsEarned,
        tier: tier ? { id: tier.id, name: tier.name } : null,
      };
    });
  }

  private async maybeLevelUp(
    user: LoyaltyUserEntity,
    manager: EntityManager,
  ): Promise<void> {
    const target = await this.tierService.findHighestTierAtOrBelow(
      Number(user.lifetime_points),
      manager,
    );
    if (target && (!user.tier || target.id !== user.tier.id)) {
      const from = user.tier;
      user.tier = target;
      await manager.getRepository(LoyaltyUserEntity).save(user);
      await this.pointService.recordTierChange(
        user,
        from,
        target,
        TierChangeReason.POINTS_THRESHOLD,
        manager,
      );
    }
  }
}
