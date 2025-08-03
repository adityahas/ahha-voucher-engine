import { Test, TestingModule } from '@nestjs/testing';
import { RewardClaimService } from './reward-claim.service';
import { DataSource, Repository } from 'typeorm';
import { RewardItemEntity } from '@core/loyalty/reward-item/entities/reward-item.entity';
import { RewardClaimStrategyFactory } from './strategy/reward-claim-strategy.factory';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RewardClaimStrategy } from './strategy/reward-claim-strategy.interface';
import { RewardItemSourceEntity } from '@core/loyalty/reward-item-source/entities/reward-item-source.entity';

describe('RewardClaimService', () => {
  let service: RewardClaimService;
  let rewardItemRepo: Repository<RewardItemEntity>;
  let dataSource: DataSource;
  let strategyFactory: RewardClaimStrategyFactory;

  const mockRewardItemRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockStrategy: RewardClaimStrategy & { claim: jest.Mock } = {
    claim: jest.fn(),
  };

  const mockStrategyFactory = {
    getStrategy: jest.fn().mockReturnValue(mockStrategy),
  };

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue(mockRewardItemRepo),
    transaction: jest.fn((cb) =>
      cb({ getRepository: jest.fn().mockReturnValue(mockRewardItemRepo) }),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardClaimService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: RewardClaimStrategyFactory,
          useValue: mockStrategyFactory,
        },
      ],
    }).compile();

    service = module.get<RewardClaimService>(RewardClaimService);
    rewardItemRepo = mockDataSource.getRepository(RewardItemEntity);
    dataSource = module.get<DataSource>(DataSource);
    strategyFactory = module.get<RewardClaimStrategyFactory>(
      RewardClaimStrategyFactory,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('claimReward', () => {
    const userId = 'user123';
    const rewardItemId = 'reward123';
    const mockRewardItem = () => {
      const item = new RewardItemEntity();
      item.id = rewardItemId;
      item.name = 'Test Reward';
      item.stock = 1;
      item.source = new RewardItemSourceEntity();
      item.source.source_type = 'gopay';
      return item;
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully claim a limited reward', async () => {
      const rewardItem = mockRewardItem();
      mockRewardItemRepo.findOne.mockResolvedValueOnce(rewardItem);
      mockStrategy.claim.mockResolvedValueOnce({
        status: 'SUCCESS',
        code: 'VOUCHER123',
      });

      const result = await service.claimReward(userId, rewardItemId);

      expect(mockRewardItemRepo.findOne).toHaveBeenCalledWith({
        where: { id: rewardItemId },
        relations: ['source'],
      });
      expect(mockRewardItemRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ stock: 0 }),
      );
      expect(mockStrategyFactory.getStrategy).toHaveBeenCalledWith('gopay');
      expect(mockStrategy.claim).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ stock: 0 }),
      );
      expect(result).toEqual({ status: 'SUCCESS', code: 'VOUCHER123' });
    });

    it('should successfully claim an unlimited reward', async () => {
      const rewardItem = mockRewardItem();
      rewardItem.stock = -1;
      mockRewardItemRepo.findOne.mockResolvedValueOnce(rewardItem);
      mockStrategy.claim.mockResolvedValueOnce({
        status: 'SUCCESS',
        code: 'VOUCHER456',
      });

      const result = await service.claimReward(userId, rewardItemId);

      expect(mockRewardItemRepo.findOne).toHaveBeenCalledWith({
        where: { id: rewardItemId },
        relations: ['source'],
      });
      expect(mockRewardItemRepo.save).not.toHaveBeenCalled();
      expect(mockStrategyFactory.getStrategy).toHaveBeenCalledWith('gopay');
      expect(mockStrategy.claim).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ stock: -1 }),
      );
      expect(result).toEqual({ status: 'SUCCESS', code: 'VOUCHER456' });
    });

    it('should throw NotFoundException if reward item not found', async () => {
      mockRewardItemRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.claimReward(userId, rewardItemId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRewardItemRepo.save).not.toHaveBeenCalled();
      expect(mockStrategy.claim).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reward item is out of stock', async () => {
      const rewardItem = mockRewardItem();
      rewardItem.stock = 0;
      mockRewardItemRepo.findOne.mockResolvedValueOnce(rewardItem);

      await expect(service.claimReward(userId, rewardItemId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRewardItemRepo.save).not.toHaveBeenCalled();
      expect(mockStrategy.claim).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if strategy claim fails', async () => {
      const rewardItem = mockRewardItem();
      mockRewardItemRepo.findOne.mockResolvedValueOnce(rewardItem);
      mockStrategy.claim.mockResolvedValueOnce({
        status: 'FAILED',
        errorMessage: 'External service error',
      });

      await expect(service.claimReward(userId, rewardItemId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRewardItemRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ stock: 0 }),
      );
      expect(mockStrategy.claim).toHaveBeenCalled();
    });
  });

  describe('findAllRewards', () => {
    it('should return all rewards', async () => {
      const mockRewards = [{ id: '1', name: 'Reward 1' }];
      mockRewardItemRepo.find.mockResolvedValueOnce(mockRewards);

      const result = await service.findAllRewards();

      expect(mockRewardItemRepo.find).toHaveBeenCalledWith({
        relations: ['source'],
      });
      expect(result).toEqual(mockRewards);
    });
  });
});
