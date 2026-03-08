// apps/frontend-consumer/src/types/voucher.ts
export interface Voucher {
  id: string;
  name: string;
  quota: number;
  active: boolean;
  start_date: string;
  end_date: string;
  categories: { id: string; name: string }[];
}
