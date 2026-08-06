import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { BadRequestException } from '@nestjs/common';
import { PurchaseConsumerService } from './purchase-consumer.service';

describe('PurchaseConsumerService', () => {
  let service: PurchaseConsumerService;

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseConsumerService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<PurchaseConsumerService>(PurchaseConsumerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully proxy purchase request to upstream loyalty service', async () => {
    const mockDto = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 2,
      voucher_code: 'PROMO2025',
      payment_method: 'MANUAL_TRANSFER',
      notes: 'Please handle with care',
    };

    const mockReq = {
      headers: {
        authorization: 'Bearer mock-jwt-token',
        'x-api-key': 'client1-api-key',
        'x-tenant-override': 'client1',
      },
    };

    const mockUpstreamResponse: AxiosResponse = {
      data: {
        id: 'order-101',
        product_id: mockDto.product_id,
        quantity: mockDto.quantity,
        total_price: 100000,
      },
      status: 201,
      statusText: 'Created',
      headers: {},
      config: { headers: {} as any },
    };

    mockHttpService.post.mockReturnValue(of(mockUpstreamResponse));

    const result = await service.executePurchase(
      mockDto as any,
      mockReq as any,
    );

    expect(result).toEqual({
      ...mockUpstreamResponse.data,
      payment_method: 'MANUAL_TRANSFER',
      notes: 'Please handle with care',
    });
    expect(mockHttpService.post).toHaveBeenCalledWith(
      'http://localhost:8080/loyalty/purchase',
      {
        product_id: mockDto.product_id,
        quantity: mockDto.quantity,
        voucher_code: mockDto.voucher_code,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
          'x-api-key': 'client1-api-key',
          'x-tenant-override': 'client1',
        }),
      }),
    );
  });

  it('should handle axios error and throw BadRequestException', async () => {
    const mockDto = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
    };

    const mockReq = { headers: {} };

    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: 'Voucher quota exhausted' },
      },
    } as AxiosError;

    mockHttpService.post.mockReturnValue(throwError(() => axiosError));

    await expect(
      service.executePurchase(mockDto as any, mockReq as any),
    ).rejects.toThrow(BadRequestException);
  });
});
