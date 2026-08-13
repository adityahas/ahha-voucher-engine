import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientSettingsEntity } from '../entities/client-settings.entity';
import {
  CurrencySettings,
  DEFAULT_CURRENCY_SETTINGS,
  LoyaltySettings,
  DEFAULT_LOYALTY_SETTINGS,
} from './client-settings.types';

export type UpdateCurrencySettingsInput = Partial<CurrencySettings>;

const OPTION_RULES: Record<string, (value: unknown) => boolean> = {
  localeMatcher: (value) => value === 'lookup' || value === 'best fit',
  style: (value) =>
    value === 'decimal' || value === 'currency' || value === 'percent',
  currency: (value) => typeof value === 'string' && /^[A-Z]{3}$/.test(value),
  currencyDisplay: (value) =>
    ['code', 'symbol', 'narrowSymbol', 'name'].includes(value as string),
  currencySign: (value) => value === 'standard' || value === 'accounting',
  unit: (value) => typeof value === 'string',
  unitDisplay: (value) => ['short', 'long', 'narrow'].includes(value as string),
  useGrouping: (value) =>
    typeof value === 'boolean' ||
    ['always', 'auto', 'min2', 'false'].includes(value as string),
  minimumIntegerDigits: (value) => isIntegerInRange(value, 1, 21),
  minimumFractionDigits: (value) => isIntegerInRange(value, 0, 20),
  maximumFractionDigits: (value) => isIntegerInRange(value, 0, 20),
  minimumSignificantDigits: (value) => isIntegerInRange(value, 1, 21),
  maximumSignificantDigits: (value) => isIntegerInRange(value, 1, 21),
  signDisplay: (value) =>
    ['auto', 'always', 'exceptZero', 'negative'].includes(value as string),
  notation: (value) =>
    ['standard', 'scientific', 'engineering', 'compact'].includes(
      value as string,
    ),
  compactDisplay: (value) => value === 'short' || value === 'long',
  roundingMode: (value) =>
    [
      'ceil',
      'floor',
      'expand',
      'trunc',
      'halfCeil',
      'halfFloor',
      'halfExpand',
      'halfTrunc',
      'halfEven',
    ].includes(value as string),
  roundingPriority: (value) =>
    ['auto', 'morePrecision', 'lessPrecision'].includes(value as string),
  trailingZeroDisplay: (value) =>
    value === 'auto' || value === 'stripIfInteger',
};

function isIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): boolean {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

@Injectable()
export class ClientSettingsService {
  constructor(
    @InjectRepository(ClientSettingsEntity)
    private readonly repository: Repository<ClientSettingsEntity>,
  ) {}

  async getForTenant(databaseName: string): Promise<CurrencySettings> {
    const settings = await this.repository.findOne({
      where: { client_database_name: databaseName },
    });
    return settings
      ? this.toSettings(settings)
      : { ...DEFAULT_CURRENCY_SETTINGS, number_format_options: {} };
  }

  async updateForTenant(
    databaseName: string,
    input: UpdateCurrencySettingsInput,
  ): Promise<CurrencySettings> {
    const current = await this.repository.findOne({
      where: { client_database_name: databaseName },
    });
    const next = {
      ...DEFAULT_CURRENCY_SETTINGS,
      ...(current ? this.toSettings(current) : {}),
      ...input,
      currency_code:
        input.currency_code?.toUpperCase() ??
        current?.currency_code?.toUpperCase() ??
        DEFAULT_CURRENCY_SETTINGS.currency_code,
      number_format_options:
        input.number_format_options === undefined
          ? (current?.number_format_options ?? {})
          : input.number_format_options,
    };
    this.validate(next);
    await this.repository.save({
      ...(current ?? {}),
      client_database_name: databaseName,
      ...next,
    });
    return next;
  }

  async getLoyaltySettings(databaseName: string): Promise<LoyaltySettings> {
    const row = await this.repository.findOne({
      where: { client_database_name: databaseName },
    });
    if (!row) return { ...DEFAULT_LOYALTY_SETTINGS };
    return {
      point_base_rate:
        Number(row.point_base_rate) ?? DEFAULT_LOYALTY_SETTINGS.point_base_rate,
      max_combined_discount_percent:
        Number(row.max_combined_discount_percent) ??
        DEFAULT_LOYALTY_SETTINGS.max_combined_discount_percent,
    };
  }

  async updateLoyaltySettings(
    databaseName: string,
    input: Partial<LoyaltySettings>,
  ): Promise<LoyaltySettings> {
    let row = await this.repository.findOne({
      where: { client_database_name: databaseName },
    });
    if (!row) {
      row = this.repository.create({ client_database_name: databaseName });
    }
    if (input.point_base_rate !== undefined) {
      row.point_base_rate = input.point_base_rate;
    }
    if (input.max_combined_discount_percent !== undefined) {
      row.max_combined_discount_percent = input.max_combined_discount_percent;
    }
    await this.repository.save(row);
    return this.getLoyaltySettings(databaseName);
  }

  private toSettings(entity: ClientSettingsEntity): CurrencySettings {
    return {
      currency_code: entity.currency_code,
      locale: entity.locale,
      number_format_options: entity.number_format_options ?? {},
    };
  }

  private validate(settings: CurrencySettings): void {
    if (!/^[A-Z]{3}$/.test(settings.currency_code)) {
      throw new Error('currency_code must be an uppercase ISO 4217 code');
    }
    if (Intl.NumberFormat.supportedLocalesOf([settings.locale]).length === 0) {
      throw new Error('locale is not supported');
    }
    try {
      new Intl.NumberFormat(settings.locale, {
        style: 'currency',
        currency: settings.currency_code,
      });
    } catch {
      throw new Error('currency_code is not supported');
    }
    for (const [key, value] of Object.entries(settings.number_format_options)) {
      if (!OPTION_RULES[key] || !OPTION_RULES[key](value)) {
        throw new Error(`unsupported number format option: ${key}`);
      }
    }
  }
}
