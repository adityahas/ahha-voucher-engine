import { TierController } from './tier.controller';

describe('TierController', () => {
  const serviceMock = { findAll: jest.fn() } as any;
  const controller = new TierController(serviceMock);

  it('delegates findAll', async () => {
    serviceMock.findAll.mockResolvedValue({ data: [], pagination: {} });
    const result = await controller.findAll({ page: 0, size: 10 } as any);
    expect(serviceMock.findAll).toHaveBeenCalled();
    expect(result).toEqual({ data: [], pagination: {} });
  });
});
