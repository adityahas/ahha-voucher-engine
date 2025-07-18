import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyLibService } from './loyalty-lib.service';

describe('LoyaltyLibService', () => {
  let service: LoyaltyLibService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyLibService],
    }).compile();

    service = module.get<LoyaltyLibService>(LoyaltyLibService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
