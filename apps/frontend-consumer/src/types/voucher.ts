export interface Voucher {
  code: string;
  name: string;
  description: string;
  quota: number;
  image: string;
  categories: { id: string; name: string }[];
  bindings: VoucherBinding[];
}

export interface VoucherBinding {
  bind_type: string;
  bind_value: string;
}

export interface ClaimedVoucherInfo {
  id: number;
  claimed_at: string;
  voucher: Voucher;
}

export interface PaginatedResponse<T> {
  code: string;
  message: string;
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
  };
}
