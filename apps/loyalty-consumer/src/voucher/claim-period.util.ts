import { ClaimPeriod } from '@core/loyalty/voucher/entities/voucher.entity';

export const DEFAULT_TIMEZONE = 'Asia/Jakarta';

export function resolveTimezone(timezone?: string | null): string {
  return timezone && timezone.trim() ? timezone : DEFAULT_TIMEZONE;
}

interface LocalParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = Sunday .. 6 = Saturday
}

function getLocalParts(date: Date, tz: string): LocalParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = dtf.formatToParts(date);
  const value = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    weekday: weekdayMap[value('weekday')] ?? 0,
  };
}

function getOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour') % 24,
    value('minute'),
    value('second'),
  );
  return asUtc - date.getTime();
}

function localToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  s: number,
  tz: string,
): Date {
  const base = Date.UTC(y, mo - 1, d, h, mi, s);
  let utc = base;
  for (let i = 0; i < 2; i += 1) {
    const offset = getOffsetMs(new Date(utc), tz);
    utc = base - offset;
  }
  return new Date(utc);
}

export function getCurrentPeriodStartUtc(
  period: ClaimPeriod,
  now: Date,
  tz: string,
): Date {
  const local = getLocalParts(now, tz);
  switch (period) {
    case ClaimPeriod.DAILY:
      return localToUtc(local.year, local.month, local.day, 0, 0, 0, tz);
    case ClaimPeriod.WEEKLY: {
      const daysSinceMonday = (local.weekday + 6) % 7;
      return localToUtc(
        local.year,
        local.month,
        local.day - daysSinceMonday,
        0,
        0,
        0,
        tz,
      );
    }
    case ClaimPeriod.MONTHLY:
      return localToUtc(local.year, local.month, 1, 0, 0, 0, tz);
    default:
      throw new Error(`claim_period ${period} has no calendar window`);
  }
}

export function isWithinCurrentPeriod(
  period: ClaimPeriod,
  claimDate: Date,
  now: Date,
  tz: string,
): boolean {
  const start = getCurrentPeriodStartUtc(period, now, tz);
  return claimDate.getTime() >= start.getTime();
}
