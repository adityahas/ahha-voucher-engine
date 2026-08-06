import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConsumerProductPurchaseDto } from './dto/consumer-product-purchase.dto';

@Injectable()
export class PurchaseConsumerService {
  constructor(private readonly httpService: HttpService) {}

  async executePurchase(
    dto: ConsumerProductPurchaseDto,
    req: any,
  ): Promise<any> {
    const baseUrl = process.env.LOYALTY_API_BASE_URL || 'http://localhost:8080';
    const targetUrl = `${baseUrl}/loyalty/purchase`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: req.headers?.authorization || '',
      'x-api-key': req.headers?.['x-api-key'] || 'client1-api-key',
      'x-tenant-override': req.headers?.['x-tenant-override'] || 'client1',
    };

    const payload = {
      product_id: dto.product_id,
      quantity: dto.quantity,
      ...(dto.voucher_code && { voucher_code: dto.voucher_code }),
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(targetUrl, payload, { headers }),
      );

      return {
        ...response.data,
        payment_method: dto.payment_method || 'MANUAL_TRANSFER',
        notes: dto.notes || null,
      };
    } catch (error: any) {
      if (error?.response) {
        const status = error.response.status || HttpStatus.BAD_REQUEST;
        const message =
          error.response.data?.message || 'Failed to complete purchase';

        if (status === 404) {
          throw new NotFoundException(message);
        } else if (status === 401) {
          throw new UnauthorizedException(message);
        } else {
          throw new BadRequestException(message);
        }
      }

      throw new HttpException(
        error.message || 'Upstream service unreachable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
