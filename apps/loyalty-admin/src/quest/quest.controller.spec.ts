import { Test, TestingModule } from '@nestjs/testing';
import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';
import { DataSource } from 'typeorm';
import { AclGuard } from '@core/auth/guards/acl.guard';
import { AdminJwtGuard } from '@core/auth/guards/admin-jwt.guard';

describe('QuestController', () => {
  let controller: QuestController;

  const mockDataSource = {
    getRepository: jest.fn().mockReturnValue({
      createQueryBuilder: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    }),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestController],
      providers: [
        QuestService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AclGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<QuestController>(QuestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
