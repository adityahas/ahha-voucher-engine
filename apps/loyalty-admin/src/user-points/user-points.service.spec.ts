import { UserPointsService } from './user-points.service';

describe('UserPointsService', () => {
  const pointServiceMock = { adjust: jest.fn() };
  const userRepoMock = { findOne: jest.fn() };
  const ledgerRepoMock = { findAndCount: jest.fn() };
  const dataSourceMock = {
    transaction: jest.fn(async (cb: any) => cb({})),
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name || '';
      if (name.includes('PointLedger')) return ledgerRepoMock;
      return userRepoMock;
    }),
  } as any;

  it('adjusts points via PointService', async () => {
    userRepoMock.findOne.mockResolvedValue({
      id: 'u1',
      core_user_id: 'c1',
    });
    pointServiceMock.adjust.mockResolvedValue(150);
    const service = new UserPointsService(
      dataSourceMock,
      pointServiceMock as any,
    );
    const result = await service.adjustPoints('c1', 50, 'compensation');
    expect(pointServiceMock.adjust).toHaveBeenCalled();
    expect(result.balance_points).toBe(150);
  });
});
