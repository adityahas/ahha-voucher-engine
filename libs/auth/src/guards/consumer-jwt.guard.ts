import { AuthGuard } from '@nestjs/passport';

export class ConsumerJwtGuard extends AuthGuard('jwt') {}
