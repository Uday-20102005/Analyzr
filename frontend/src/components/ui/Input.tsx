import React from 'react';
import { cn } from './cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 px-4 rounded-xl bg-white border border-gray-300 text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:border-purple-500',
          className,
        )}
        {...rest}
      />
    );
  },
);

Input.displayName = 'Input';

