import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'small' | 'medium' | 'large';
}

export function Logo({ className, size = 'medium', ...props }: LogoProps) {
  return (
    <div
      className={cn(
        'font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent',
        {
          'text-xl': size === 'small',
          'text-3xl': size === 'medium',
          'text-5xl': size === 'large',
        },
        className
      )}
      {...props}
    >
      <span>Cosmic Hoops</span>
    </div>
  );
}
