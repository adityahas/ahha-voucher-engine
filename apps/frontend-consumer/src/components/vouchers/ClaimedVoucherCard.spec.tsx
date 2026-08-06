import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClaimedVoucherCard } from './ClaimedVoucherCard';
import type { ClaimedVoucherInfo } from '../../types/voucher';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const claimedVoucher: ClaimedVoucherInfo = {
  id: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  voucher: {
    code: 'SAVE10',
    name: 'Save 10',
    description: 'A claimed voucher',
    voucher_type: 'CLAIMABLE',
    quota: 1,
    image: '',
    discount_type: 'percentage',
    discount_value: 10,
    categories: [],
    bindings: [],
  },
};

describe('ClaimedVoucherCard', () => {
  it('renders the tenant-formatted percentage discount', () => {
    render(<ClaimedVoucherCard claimedVoucher={claimedVoucher} index={0} />);

    expect(screen.getByText('10% off')).toBeInTheDocument();
  });
});
