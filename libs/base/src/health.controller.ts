import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: process.env.SERVICE_NAME || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
}
