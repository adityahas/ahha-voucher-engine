import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges standard Tailwind classes with dynamic overrides nicely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
