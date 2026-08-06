export type VoucherType = 'CLAIMABLE' | 'UNIQUE_CODE';
export type DiscountType =
  'PERCENTAGE' | 'FIXED_AMOUNT' | 'percentage' | 'fixed';

export interface Voucher {
  voucher_type: VoucherType;
  code: string;
  name: string;
  description: string;
  quota: number;
  image: string;
  discount_type: DiscountType;
  discount_value: number;
  categories: { id: string; name: string }[];
  bindings: VoucherBinding[];
}

export interface CalculateDiscountRequest {
  voucher_code: string;
  product_id: string;
  quantity: number;
}

export interface CalculateDiscountResponse {
  isValid: boolean;
  discountAmount: number;
  finalPrice: number;
  message: string;
}

export interface VoucherBinding {
  bind_type: string;
  bind_value: string;
}

export interface ClaimedVoucherInfo {
  id: number;
  created_at: string;
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
