import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CredentialMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
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
