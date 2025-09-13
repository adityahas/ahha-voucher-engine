import { Test, TestingModule } from '@nestjs/testing';
import { VoucherCategoryController } from './voucher-category.controller';
import { VoucherCategoryService } from './voucher-category.service';
import { BasePaginationDto } from '@core/base/dto/base-pagination.dto';

describe('VoucherCategoryController', () => {
  let controller: VoucherCategoryController;
  let service: jest.Mocked<VoucherCategoryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoucherCategoryController],
      providers: [
        {
          provide: VoucherCategoryService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VoucherCategoryController>(
      VoucherCategoryController,
    );
    service = module.get(VoucherCategoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a list of voucher categories', async () => {
      const paginationDto: BasePaginationDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [
          {
            slug: 'food',
            name: 'Food',
            description: 'Food vouchers',
            image: 'food.jpg',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };
      service.findAll.mockResolvedValue(mockResult);

      expect(await controller.findAll(paginationDto)).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
    });
  });
});
