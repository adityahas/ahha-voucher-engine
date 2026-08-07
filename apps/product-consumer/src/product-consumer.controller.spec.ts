import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';
import { ProductConsumerController } from './product-consumer.controller';

describe('ProductConsumerController', () => {
  let controller: ProductConsumerController;
  let repository: { find: jest.Mock; findOneOrFail: jest.Mock };

  const mockProduct = {
    id: '4dce0599-fca9-4705-ace2-4213e40d65af',
    name: 'Sample Product',
    price: '10000',
    is_active: true,
  };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOneOrFail: jest.fn(),
    };

    const mockDataSource = {
      getRepository: jest.fn(() => repository),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductConsumerController],
      providers: [
        { provide: 'PRODUCT_CONSUMER_CONNECTION', useValue: mockDataSource },
      ],
    }).compile();

    controller = module.get<ProductConsumerController>(
      ProductConsumerController,
    );
  });

  describe('findAll', () => {
    it('returns only active products ordered by created_at desc', async () => {
      repository.find.mockResolvedValue([mockProduct]);

      const result = await controller.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('returns the product when it exists and is active', async () => {
      repository.findOneOrFail.mockResolvedValue(mockProduct);

      const result = await controller.findOne(mockProduct.id);

      expect(repository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockProduct.id, is_active: true },
      });
      expect(result).toEqual(mockProduct);
    });

    it('throws NotFoundException when the product does not exist', async () => {
      repository.findOneOrFail.mockRejectedValue(
        new EntityNotFoundError('ProductEntity', {
          id: 'missing-id',
        }),
      );

      await expect(controller.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('missing-id')).rejects.toThrow(
        'Product missing-id not found',
      );
    });

    it('re-throws non-not-found errors', async () => {
      const dbError = new Error('connection refused');
      repository.findOneOrFail.mockRejectedValue(dbError);

      await expect(controller.findOne(mockProduct.id)).rejects.toThrow(
        'connection refused',
      );
    });
  });
});
