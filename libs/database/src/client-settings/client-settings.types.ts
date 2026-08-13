export interface CurrencySettings {
  currency_code: string;
  locale: string;
  number_format_options: Intl.NumberFormatOptions;
}

export const DEFAULT_CURRENCY_SETTINGS: CurrencySettings = {
  currency_code: 'IDR',
  locale: 'id-ID',
  number_format_options: {},
};

export interface LoyaltySettings {
  point_base_rate: number;
  max_combined_discount_percent: number;
  point_to_currency_rate: number;
}

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  point_base_rate: 1000,
  max_combined_discount_percent: 50,
  point_to_currency_rate: 1,
};
