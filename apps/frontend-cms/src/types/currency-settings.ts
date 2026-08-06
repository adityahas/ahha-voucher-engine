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
