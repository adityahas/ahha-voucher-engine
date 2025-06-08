import { Controller, Get, UseGuards } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('tier')
@ApiBearerAuth()
@Controller('tiers')
export class TierController {
  @Permissions('tier.read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List tier' })
  @Get()
  findAll() {
    return [{ level: 'bronze' }, { level: 'silver' }, { level: 'gold' }];
  }
}
