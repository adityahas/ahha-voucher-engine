export type ClaimPeriod = 'FREE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONCE';

export type Language = 'id' | 'en';

export interface ClaimPeriodInfo {
  label: Record<Language, string>;
}

export const CLAIM_PERIOD_MAP: Record<ClaimPeriod, ClaimPeriodInfo> = {
  FREE: {
    label: { id: 'Bebas (Unlimited)', en: 'Free (Unlimited)' },
  },
  DAILY: {
    label: { id: 'Harian', en: 'Daily' },
  },
  WEEKLY: {
    label: { id: 'Mingguan', en: 'Weekly' },
  },
  MONTHLY: {
    label: { id: 'Bulanan', en: 'Monthly' },
  },
  ONCE: {
    label: { id: 'Sekali Saja', en: 'Once' },
  },
};

export const formatClaimPeriod = (
  period?: ClaimPeriod | string | null,
  lang: Language = 'id',
): string => {
  if (!period) return 'NOT CONFIGURED';
  const info = CLAIM_PERIOD_MAP[period as ClaimPeriod];
  return info ? info.label[lang] : String(period);
};
