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
    const host = req.headers.host; // e.g., "client1.example.com"
    const subdomain = host.split('.')[0]; // Extract subdomain, e.g., "client1"

    console.log('host', host);
    console.log('subdomain', subdomain);

    //TODO: Probably need to implement redis caching here
    const client = await this.dataSource
      .getRepository(ClientEntity)
      .findOne({ where: { subdomain } });

    if (!client) {
      throw new UnauthorizedException('Invalid subdomain.');
    }

    req['client'] = client;
    next();
  }
}
