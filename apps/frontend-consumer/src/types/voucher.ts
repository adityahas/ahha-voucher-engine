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
