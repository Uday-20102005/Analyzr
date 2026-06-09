import { cn } from './cn';

type CardTone = 'default' | 'muted' | 'elevated';

export function Card({
  className,
  tone = 'default',
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { tone?: CardTone }) {
  const toneClasses: Record<CardTone, string> = {
    default: 'bg-white border border-gray-200 shadow-sm',
    muted: 'bg-gray-50 border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-300 shadow-md',
  };

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden',
        toneClasses[tone],
        className,
      )}
      {...rest}
    />
  );
}

