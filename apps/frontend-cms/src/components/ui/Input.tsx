import React from 'react';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon: Icon, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">
            {label}
          </label>
        )}

        <div className="relative group">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  error
                    ? 'text-red-400'
                    : 'text-slate-500 group-focus-within:text-primary-400',
                )}
              />
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              'block w-full py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:border-transparent transition-all hover:bg-slate-800/60 text-sm',
              Icon ? 'pl-11 pr-4' : 'px-4',
              error
                ? 'border-red-500/50 focus:ring-red-500'
                : 'border-slate-700/50 focus:ring-primary-500',
              className,
            )}
            {...props}
          />
        </div>

        {error ? (
          <p className="text-xs text-red-400 font-medium ml-1 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 ml-1 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
