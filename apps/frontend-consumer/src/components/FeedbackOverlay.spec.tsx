import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeedbackOverlay } from './FeedbackOverlay';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
    h3: ({ children, className }: any) => (
      <h3 className={className}>{children}</h3>
    ),
    button: ({ children, className, onClick }: any) => (
      <button className={className} onClick={onClick}>
        {children}
      </button>
    ),
    div_animate: ({ children }: any) => <>{children}</>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('FeedbackOverlay', () => {
  it('renders nothing when status is idle', () => {
    const { container } = render(<FeedbackOverlay status="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders processing state with spinner', () => {
    render(<FeedbackOverlay status="processing" />);
    expect(screen.getByText('Processing Transaction')).toBeInTheDocument();
    // Loader icon should be present (via Lucide class or svg)
    expect(
      document.querySelector('.lucide-loader-circle') ||
        document.querySelector('.lucide-loader-2'),
    ).toBeInTheDocument();
  });

  it('renders success state with message', () => {
    const onClose = vi.fn();
    render(
      <FeedbackOverlay
        status="success"
        message="Well done!"
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Purchase Successful!')).toBeInTheDocument();
    expect(screen.getByText('Well done!')).toBeInTheDocument();

    const button = screen.getByText('Continue');
    fireEvent.click(button);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders error state with message', () => {
    const onClose = vi.fn();
    render(
      <FeedbackOverlay
        status="error"
        message="Something exploded"
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Transaction Failed')).toBeInTheDocument();
    expect(screen.getByText('Something exploded')).toBeInTheDocument();

    const button = screen.getByText('Try Again');
    fireEvent.click(button);
    expect(onClose).toHaveBeenCalled();
  });

  it('applies Vibe Coding aesthetic classes', () => {
    render(<FeedbackOverlay status="success" />);
    const container = screen
      .getByText('Purchase Successful!')
      .closest('.bg-white\\/10');
    expect(container).toHaveClass('backdrop-blur-2xl');
    expect(container).toHaveClass('border-white/20');
  });
});
