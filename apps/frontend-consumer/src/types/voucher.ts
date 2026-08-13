export type VoucherType = 'CLAIMABLE' | 'UNIQUE_CODE';
export type DiscountType =
  'PERCENTAGE' | 'FIXED_AMOUNT' | 'percentage' | 'fixed';

export interface VoucherValidity {
  type: string;
  start_date: string;
  end_date: string | null;
}

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
  validities?: VoucherValidity[];
}

export interface CalculateDiscountRequest {
  voucher_code: string;
  product_id: string;
  quantity: number;
  points_to_use?: number;
}

export interface CalculateDiscountResponse {
  isValid: boolean;
  discountAmount: number;
  finalPrice: number;
  message: string;
  subtotal?: number;
  voucher_discount_amount?: number;
  points_used?: number;
  point_discount_amount?: number;
  cash_amount?: number;
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
