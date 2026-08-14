import { UserPointsService } from './user-points.service';
import { LoyaltyTierEntity } from '@core/loyalty/tier/entities/loyalty-tier.entity';
import { TierChangeReason } from '@core/loyalty/point/entities/tier-history.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UserPointsService', () => {
  describe('adjustPoints', () => {
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
    const tierServiceMock = { grantLevelUpVoucher: jest.fn() };

    it('adjusts points via PointService', async () => {
      userRepoMock.findOne.mockResolvedValue({
        id: 'u1',
        core_user_id: 'c1',
      });
      pointServiceMock.adjust.mockResolvedValue(150);
      const service = new UserPointsService(
        dataSourceMock,
        pointServiceMock as any,
        tierServiceMock as any,
      );
      const result = await service.adjustPoints('c1', 50, 'compensation');
      expect(pointServiceMock.adjust).toHaveBeenCalled();
      expect(result.balance_points).toBe(150);
    });
  });

  describe('assignTier', () => {
    const userRepoMock = { findOne: jest.fn() };
    const tierRepoMock = { findOne: jest.fn() };
    const userSaveMock = { save: jest.fn((e: any) => Promise.resolve(e)) };
    const pointServiceMock = { recordTierChange: jest.fn() };
    const tierServiceMock = {
      grantLevelUpVoucher: jest.fn().mockReturnValue({
        granted: true,
        voucherCode: 'GOLD2030',
        message: 'granted',
      }),
    };
    let managerMock: any;

    const dataSourceMock = {
      getRepository: jest.fn((entity: any) => {
        if (entity === LoyaltyTierEntity) return tierRepoMock;
        return userRepoMock;
      }),
      transaction: jest.fn(async (cb: any) => cb(managerMock)),
    } as any;

    function makeService() {
      return new UserPointsService(
        dataSourceMock,
        pointServiceMock as any,
        tierServiceMock as any,
      );
    }

    beforeEach(() => {
      jest.clearAllMocks();
      managerMock = {
        getRepository: jest.fn().mockReturnValue(userSaveMock),
      };
    });

    it('throws NotFoundException when the loyalty user does not exist', async () => {
      userRepoMock.findOne.mockResolvedValue(null);
      await expect(makeService().assignTier('c1', 't1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the tier does not exist', async () => {
      userRepoMock.findOne.mockResolvedValue({ id: 'u1', tier: null });
      tierRepoMock.findOne.mockResolvedValue(null);
      await expect(makeService().assignTier('c1', 't1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when user is already on the tier', async () => {
      userRepoMock.findOne.mockResolvedValue({
        id: 'u1',
        tier: { id: 't1' },
      });
      tierRepoMock.findOne.mockResolvedValue({ id: 't1' });
      await expect(makeService().assignTier('c1', 't1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('assigns tier, records MANUAL change, and grants the voucher', async () => {
      const user = { id: 'u1', tier: { id: 'bronze' } };
      userRepoMock.findOne.mockResolvedValue(user);
      tierRepoMock.findOne.mockResolvedValue({ id: 'gold' });
      tierServiceMock.grantLevelUpVoucher.mockResolvedValue({
        granted: true,
        voucherCode: 'GOLD2030',
        message: 'granted',
      });

      const result = await makeService().assignTier('c1', 'gold');

      expect(pointServiceMock.recordTierChange).toHaveBeenCalledWith(
        user,
        { id: 'bronze' },
        { id: 'gold' },
        TierChangeReason.MANUAL,
        managerMock,
      );
      expect(tierServiceMock.grantLevelUpVoucher).toHaveBeenCalledWith(
        user,
        { id: 'gold' },
        managerMock,
      );
      expect(result).toEqual({
        granted: true,
        voucherCode: 'GOLD2030',
        message: 'granted',
      });
    });
  });
});
