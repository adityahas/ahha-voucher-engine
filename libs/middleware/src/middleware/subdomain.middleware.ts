import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { ClientEntity } from '@core/database/entities/client.entity';

@Injectable()
export class SubdomainMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const override =
      (req.headers['x-tenant-override'] as string) ||
      (req.headers['x-subdomain'] as string);

    const extracted = host.split(':')[0].split('.')[0];
    const subdomain =
      override ||
      (extracted === 'localhost' ||
      extracted === '127' ||
      extracted === 'api-gateway'
        ? 'client1'
        : extracted);

    const client = await this.dataSource
      .getRepository(ClientEntity)
      .findOne({ where: { subdomain } });

    if (!client) {
      throw new UnauthorizedException(`Invalid subdomain: ${subdomain}`);
    }

    req['client'] = client;
    next();
  }
}
