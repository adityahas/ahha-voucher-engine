import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/*
 * Middleware to validate API key from request headers against the client's API key.
 * This middleware runs after subdomain middleware
 */
@Injectable()
export class CredentialMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') {
      return next();
    }

    const client = req['client'];
    const apiKey = req.headers['x-api-key'];

    console.log('client.api_key', client.api_key);
    console.log('apiKey', apiKey);

    if (!client || client.api_key !== apiKey) {
      throw new UnauthorizedException('Invalid API key.');
    }

    next();
  }
}
