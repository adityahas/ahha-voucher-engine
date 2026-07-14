import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-300">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              'flex h-12 w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2 text-sm text-white placeholder:text-slate-500 backdrop-blur-md transition-all focus:border-cyan-500 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              className,
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';
