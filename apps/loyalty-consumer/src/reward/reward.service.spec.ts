import { RewardService } from './reward.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('RewardService', () => {
  const rewardRepoMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };
  const userRepoMock = { findOne: jest.fn() };
  const strategyMock = { claim: jest.fn() };
  const strategyFactoryMock = {
    getStrategy: jest.fn().mockReturnValue(strategyMock),
  };
  const pointServiceMock = { spend: jest.fn() };

  const managerMock = {
    getRepository: jest.fn((entity: any) => {
      const name = entity?.name || '';
      if (name.includes('LoyaltyUser')) return userRepoMock;
      return rewardRepoMock;
    }),
  };

  const dataSourceMock = {
    transaction: jest.fn((cb: (em: any) => any) => cb(managerMock)),
    getRepository: jest.fn(() => rewardRepoMock),
  };

  let service: RewardService;

  const makeReward = (overrides: any = {}) => ({
    id: 'r1',
    name: 'GoPay voucher',
    stock: 5,
    point_price: 1000,
    exclusive_days: 0,
    min_tier: null,
    source: { source_type: 'gopay' },
    created_at: new Date(),
    ...overrides,
  });

  const makeUser = (overrides: any = {}) => ({
    id: 'u1',
    core_user_id: 'c1',
    balance_points: 5000,
    tier: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    dataSourceMock.transaction.mockImplementation((cb) => cb(managerMock));
    dataSourceMock.getRepository.mockImplementation(() => rewardRepoMock);
    managerMock.getRepository.mockImplementation((entity: any) => {
      const name = entity?.name || '';
      if (name.includes('LoyaltyUser')) return userRepoMock;
      return rewardRepoMock;
    });
    strategyFactoryMock.getStrategy.mockReturnValue(strategyMock);
    strategyMock.claim.mockResolvedValue({ status: 'SUCCESS', code: 'V-123' });
    pointServiceMock.spend.mockResolvedValue(0);
    service = new RewardService(
      dataSourceMock as any,
      strategyFactoryMock as any,
      pointServiceMock as any,
    );
  });

  it('rejects claim when balance is insufficient', async () => {
    const rewardItem = makeReward({ point_price: 1000 });
    const user = makeUser({ balance_points: 100 });
    rewardRepoMock.findOne.mockResolvedValue(rewardItem);
    userRepoMock.findOne.mockResolvedValue(user);
    pointServiceMock.spend.mockRejectedValue(new Error('Insufficient points'));

    await expect(service.claimReward('c1', 'r1')).rejects.toThrow(
      'Insufficient points',
    );
    expect(pointServiceMock.spend).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when reward item does not exist', async () => {
    rewardRepoMock.findOne.mockResolvedValue(null);

    await expect(service.claimReward('c1', 'r1')).rejects.toThrow(
      NotFoundException,
    );
    expect(strategyMock.claim).not.toHaveBeenCalled();
  });

  it('rejects claim when reward is out of stock', async () => {
    rewardRepoMock.findOne.mockResolvedValue(makeReward({ stock: 0 }));

    await expect(service.claimReward('c1', 'r1')).rejects.toThrow(
      'Reward item is out of stock',
    );
    expect(strategyMock.claim).not.toHaveBeenCalled();
    expect(pointServiceMock.spend).not.toHaveBeenCalled();
  });

  it('rejects claim when user tier is below the required tier', async () => {
    rewardRepoMock.findOne.mockResolvedValue(
      makeReward({
        min_tier: { id: 'g', name: 'Gold', level: 3 },
      }),
    );
    userRepoMock.findOne.mockResolvedValue(
      makeUser({ tier: { id: 'b', name: 'Bronze', level: 1 } }),
    );

    await expect(service.claimReward('c1', 'r1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(strategyMock.claim).not.toHaveBeenCalled();
    expect(pointServiceMock.spend).not.toHaveBeenCalled();
  });

  it('claims successfully, decrements stock, and spends points', async () => {
    const rewardItem = makeReward();
    const user = makeUser();
    rewardRepoMock.findOne.mockResolvedValue(rewardItem);
    userRepoMock.findOne.mockResolvedValue(user);

    const result = await service.claimReward('c1', 'r1');

    expect(strategyFactoryMock.getStrategy).toHaveBeenCalledWith('gopay');
    expect(strategyMock.claim).toHaveBeenCalledWith('c1', rewardItem);
    expect(result.status).toBe('SUCCESS');
    expect(rewardItem.stock).toBe(4);
    expect(rewardRepoMock.save).toHaveBeenCalledWith(rewardItem);
    expect(pointServiceMock.spend).toHaveBeenCalledWith(
      user,
      1000,
      'REWARD_CLAIM',
      'r1',
      managerMock,
    );
  });

  it('does not spend points for a free reward (point_price 0)', async () => {
    const rewardItem = makeReward({ point_price: 0 });
    rewardRepoMock.findOne.mockResolvedValue(rewardItem);
    userRepoMock.findOne.mockResolvedValue(makeUser());

    const result = await service.claimReward('c1', 'r1');

    expect(result.status).toBe('SUCCESS');
    expect(pointServiceMock.spend).not.toHaveBeenCalled();
  });

  it('does not decrement stock for unlimited rewards (stock -1)', async () => {
    const rewardItem = makeReward({ stock: -1 });
    rewardRepoMock.findOne.mockResolvedValue(rewardItem);
    userRepoMock.findOne.mockResolvedValue(makeUser());

    await service.claimReward('c1', 'r1');

    expect(rewardRepoMock.save).not.toHaveBeenCalled();
  });

  it('rolls back on strategy failure: points are never spent', async () => {
    const rewardItem = makeReward();
    rewardRepoMock.findOne.mockResolvedValue(rewardItem);
    userRepoMock.findOne.mockResolvedValue(makeUser());
    strategyMock.claim.mockResolvedValue({
      status: 'FAILED',
      errorMessage: 'Provider rejected',
    });

    await expect(service.claimReward('c1', 'r1')).rejects.toThrow(
      new BadRequestException('Provider rejected'),
    );
    expect(pointServiceMock.spend).not.toHaveBeenCalled();
  });

  it('returns claim result code on success', async () => {
    rewardRepoMock.findOne.mockResolvedValue(makeReward());
    userRepoMock.findOne.mockResolvedValue(makeUser());
    strategyMock.claim.mockResolvedValue({ status: 'SUCCESS', code: 'V-999' });

    const result = await service.claimReward('c1', 'r1');

    expect(result.code).toBe('V-999');
  });

  it('lists rewards including source and tier relations', async () => {
    const rewards = [makeReward()];
    rewardRepoMock.find.mockResolvedValue(rewards);

    await expect(service.findAllRewards()).resolves.toEqual(rewards);
    expect(rewardRepoMock.find).toHaveBeenCalledWith({
      relations: ['source', 'min_tier'],
    });
  });
});
