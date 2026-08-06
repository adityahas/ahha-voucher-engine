export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export type Language = 'id' | 'en';

export interface DiscountTypeInfo {
  label: Record<Language, string>;
  shortLabel: Record<Language, string>;
  symbol: string;
}

export const DISCOUNT_TYPE_MAP: Record<DiscountType, DiscountTypeInfo> = {
  [DiscountType.PERCENTAGE]: {
    label: {
      id: 'Persentase (%)',
      en: 'Percentage (%)',
    },
    shortLabel: {
      id: 'Persentase',
      en: 'Percentage',
    },
    symbol: '%',
  },
  [DiscountType.FIXED_AMOUNT]: {
    label: {
      id: 'Nominal Tetap (Rp)',
      en: 'Fixed Amount (Rp)',
    },
    shortLabel: {
      id: 'Nominal Tetap',
      en: 'Fixed Amount',
    },
    symbol: 'Rp',
  },
};

export const formatDiscountType = (
  type?: DiscountType | string | null,
  lang: Language = 'id',
): string => {
  if (!type) return 'NOT CONFIGURED';
  const info = DISCOUNT_TYPE_MAP[type as DiscountType];
  return info ? info.label[lang] : String(type);
};

export const formatDiscountTypeShort = (
  type?: DiscountType | string | null,
  lang: Language = 'id',
): string => {
  if (!type) return '-';
  const info = DISCOUNT_TYPE_MAP[type as DiscountType];
  return info ? info.shortLabel[lang] : String(type);
};

export const getDiscountSymbol = (
  type?: DiscountType | string | null,
): string => {
  if (!type) return '';
  const info = DISCOUNT_TYPE_MAP[type as DiscountType];
  return info ? info.symbol : '';
};
