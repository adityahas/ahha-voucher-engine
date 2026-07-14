import { HealthController } from './health.controller';

describe('HealthController', () => {
  const originalServiceName = process.env.SERVICE_NAME;

  afterEach(() => {
    process.env.SERVICE_NAME = originalServiceName;
  });

  it('returns an ok health response for the current service', () => {
    process.env.SERVICE_NAME = 'test-service';

    const response = new HealthController().check();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('test-service');
    expect(new Date(response.timestamp).toString()).not.toBe('Invalid Date');
  });
});
