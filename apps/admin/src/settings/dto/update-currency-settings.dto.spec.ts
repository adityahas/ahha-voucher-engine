import { ValidationPipe } from '@nestjs/common';
import { UpdateCurrencySettingsDto } from './update-currency-settings.dto';

describe('UpdateCurrencySettingsDto', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  it('preserves valid nested allowlisted options', async () => {
    await expect(
      pipe.transform(
        {
          number_format_options: {
            useGrouping: false,
            minimumFractionDigits: 2,
          },
        },
        { type: 'body', metatype: UpdateCurrencySettingsDto },
      ),
    ).resolves.toEqual({
      number_format_options: {
        useGrouping: false,
        minimumFractionDigits: 2,
      },
    });
  });

  it.each([
    { number_format_options: { unsupported: true } },
    { number_format_options: { useGrouping: 'false' } },
    { number_format_options: { style: 'invalid' } },
  ])('rejects invalid nested options: %j', async (body) => {
    await expect(
      pipe.transform(body, {
        type: 'body',
        metatype: UpdateCurrencySettingsDto,
      }),
    ).rejects.toThrow();
  });
});
