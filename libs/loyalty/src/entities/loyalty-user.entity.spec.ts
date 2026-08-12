import { LoyaltyUserEntity } from './loyalty-user.entity';

describe('LoyaltyUserEntity', () => {
  it('defines points and tier snapshot columns', () => {
    const user = new LoyaltyUserEntity();
    user.core_user_id = 'c0b1e5a0-0000-4000-8000-000000000001';
    user.lifetime_points = 120.5;
    user.balance_points = 50;
    expect(user.lifetime_points).toBe(120.5);
    expect(user.balance_points).toBe(50);
    expect(user.tier).toBeUndefined();
  });
});
