import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4',
  md: 'h-10 px-5',
  lg: 'h-12 px-7',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg',
  secondary: 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-slate-900 shadow-sm',
  outline: 'bg-transparent border border-gray-300 text-slate-900 hover:bg-gray-50',
  ghost: 'bg-transparent hover:bg-gray-100 border border-transparent text-slate-900',
  danger: 'bg-red-100 hover:bg-red-200 border border-red-300 text-red-700',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, sizeClasses[size], variantClasses[variant], className)}
      {...rest}
    />
  );
}

