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
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { DataSource, EntityManager } from 'typeorm';
import { ProductEntity } from '@core/product/entities/product.entity';
import {
  OrderEntity,
  OrderPaymentStatus,
} from '@core/product/entities/order.entity';
import { LoyaltyUserEntity } from '@core/loyalty/entities/loyalty-user.entity';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import {
  TierService,
  LevelUpGrantResult,
} from '@core/loyalty/tier/tier.service';
import { PointService } from '@core/loyalty/point/point.service';
import { TierChangeReason } from '@core/loyalty/point/entities/tier-history.entity';
import { ClientSettingsService } from '@core/database/client-settings/client-settings.service';
import { computeTierDiscountAndPoints } from './discount-points.util';
import { calculateHybridPayment } from './point-payment.calculator';

@Controller('/loyalty/purchase')
@UseGuards(ConsumerJwtGuard)
export class PurchaseController {
  constructor(
    @Inject('VOUCHER_SERVICE') private readonly voucherService: VoucherService,
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

      const productWithCategories = await manager.findOne(ProductEntity, {
        where: { id: dto.product_id },
        relations: ['categories'],
      });

      if (dto.voucher_code) {
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

      // Layer points on top of the existing voucher + tier discount. The
      // shared calculator revalidates balance/limits against the live user
      // balance inside the transaction; frontend values are never trusted.
      const hybrid = calculateHybridPayment({
        subtotal,
        voucher_discount_amount: calc.combined_discount,
        user_balance_points: Number(user.balance_points ?? 0),
        point_to_currency_rate: Number(settings.point_to_currency_rate),
        points_to_use: dto.points_to_use,
      });

      const cashAmount = hybrid.cash_amount;
      const paymentStatus =
        cashAmount === 0
          ? OrderPaymentStatus.PAID
          : OrderPaymentStatus.PENDING_PAYMENT;

      const order = await manager.getRepository(OrderEntity).save(
        manager.getRepository(OrderEntity).create({
          user_id: userId,
          product_id: product.id,
          quantity: dto.quantity,
          subtotal: Number(subtotal),
          discount_amount: Number(calc.combined_discount),
          voucher_discount_amount: hybrid.voucher_discount_amount,
          points_used: hybrid.points_used,
          point_discount_amount: hybrid.point_discount_amount,
          cash_amount: cashAmount,
          total_price: cashAmount,
          payment_status: paymentStatus,
          voucher_code: dto.voucher_code || null,
        }),
      );

      // Spend requested points against the order, recording a negative
      // ledger entry with a PRODUCT_PURCHASE reference to the order ID.
      if (hybrid.points_used > 0) {
        await this.pointService.spend(
          user,
          hybrid.points_used,
          'PRODUCT_PURCHASE',
          order.id,
          manager,
        );
      }

      let levelUpGrant: LevelUpGrantResult | null = null;

      // Points are earned on the cash actually paid so point-funded orders
      // do not earn on the portion settled with points.
      const pointsEarned =
        (cashAmount / Number(settings.point_base_rate)) * multiplier;
      if (pointsEarned > 0) {
        await this.pointService.earn(
          user,
          pointsEarned,
          'ORDER',
          order.id,
          manager,
        );
        levelUpGrant = await this.maybeLevelUp(user, manager);
      }

      return {
        ...order,
        points_earned: pointsEarned,
        tier: user.tier ? { id: user.tier.id, name: user.tier.name } : null,
        level_up_grant: levelUpGrant,
      };
    });
  }

  private async maybeLevelUp(
    user: LoyaltyUserEntity,
    manager: EntityManager,
  ): Promise<LevelUpGrantResult | null> {
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
      return this.tierService.grantLevelUpVoucher(user, target, manager);
    }
    return null;
  }
}
