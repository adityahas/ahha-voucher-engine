import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VoucherCard } from './VoucherCard';
import type { Voucher } from '../../types/voucher';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../api/vouchers', () => ({
  claimVoucher: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../context/currency-settings', () => ({
  useCurrencySettings: () => ({
    currency_code: 'USD',
    locale: 'en-US',
    number_format_options: {},
  }),
}));

const voucher = (discount_type: Voucher['discount_type']): Voucher => ({
  code: 'SAVE10',
  name: 'Save 10',
  description: 'A voucher',
  voucher_type: 'CLAIMABLE',
  quota: 1,
  image: '',
  discount_type,
  discount_value: 10,
  categories: [],
  bindings: [],
});

describe('VoucherCard', () => {
  it.each([
    ['percentage', '10% off'],
    ['PERCENTAGE', '10% off'],
    ['fixed', '$10.00'],
  ] as const)('renders %s discounts correctly', (discountType, expected) => {
    render(<VoucherCard voucher={voucher(discountType)} index={0} />);

    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
