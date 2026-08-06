import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseConsumerController } from './purchase-consumer.controller';
import { PurchaseConsumerService } from './purchase-consumer.service';
import { ConsumerJwtGuard } from '@core/auth/guards/consumer-jwt.guard';

describe('PurchaseConsumerController', () => {
  let controller: PurchaseConsumerController;
  let service: PurchaseConsumerService;

  const mockService = {
    executePurchase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseConsumerController],
      providers: [{ provide: PurchaseConsumerService, useValue: mockService }],
    })
      .overrideGuard(ConsumerJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PurchaseConsumerController>(
      PurchaseConsumerController,
    );
    service = module.get<PurchaseConsumerService>(PurchaseConsumerService);
  });

  it('should call executePurchase on service and return order', async () => {
    const mockDto = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 1,
    };
    const mockReq = { user: { core_user_id: 'user-1' } };
    const mockResult = { id: 'order-1', total_price: 50000 };

    mockService.executePurchase.mockResolvedValue(mockResult);

    const response = await controller.purchase(mockReq, mockDto as any);

    expect(service.executePurchase).toHaveBeenCalledWith(mockDto, mockReq);
    expect(response).toEqual(mockResult);
  });
});
