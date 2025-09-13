import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { LoyaltyAdminModule } from '../src/loyalty-admin.module';
import { VoucherCategoryService } from '../src/voucher-category/voucher-category.service';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@core/auth/roles.enum';

describe('VoucherCategoryController (e2e)', () => {
  let app: INestApplication;
  let voucherCategoryService: VoucherCategoryService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LoyaltyAdminModule],
    })
      .overrideProvider(VoucherCategoryService)
      .useValue({
        findAll: jest.fn().mockResolvedValue({
          data: [
            {
              slug: 'food',
              name: 'Food',
              description: 'Food vouchers',
              image: 'food.jpg',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    voucherCategoryService = moduleFixture.get<VoucherCategoryService>(
      VoucherCategoryService,
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('/loyalty-admin/voucher-categories (GET)', async () => {
    const adminPayload = {
      email: 'admin@example.com',
      sub: 'admin-id',
      role: Role.ADMIN,
    };
    const authToken = jwtService.sign(adminPayload);

    const response = await request(app.getHttpServer())
      .get('/loyalty-admin/voucher-categories')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          slug: 'food',
          name: 'Food',
          description: 'Food vouchers',
          image: 'food.jpg',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });
    expect(voucherCategoryService.findAll).toHaveBeenCalled();
  });
});
