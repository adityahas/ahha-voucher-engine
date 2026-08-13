import { PointsService } from './points.service';

describe('PointsService', () => {
  const userRepoMock = { findOne: jest.fn() };
  const ledgerRepoMock = { findAndCount: jest.fn() };
  const tierRepoMock = { find: jest.fn() };
  const dataSourceMock = {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name || '';
      if (name.includes('PointLedger')) return ledgerRepoMock;
      if (name.includes('LoyaltyTier')) return tierRepoMock;
      return userRepoMock;
    }),
  } as any;

  it('returns profile with next tier', async () => {
    userRepoMock.findOne.mockResolvedValue({
      id: 'u1',
      core_user_id: 'c1',
      lifetime_points: 120,
      balance_points: 50,
      tier: { id: 'b', level: 1, name: 'Bronze', min_points: 0 },
    });
    tierRepoMock.find.mockResolvedValue([
      { id: 'b', level: 1, name: 'Bronze', min_points: 0 },
      { id: 's', level: 2, name: 'Silver', min_points: 10000 },
    ]);
    const service = new PointsService(dataSourceMock);
    const profile = await service.getProfile('c1');
    expect(profile.next_tier?.name).toBe('Silver');
    expect(profile.lifetime_points).toBe(120);
  });
});
