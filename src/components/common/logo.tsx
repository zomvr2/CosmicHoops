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
        { // Adjusted sizes slightly for the new design
          'text-xl': size === 'small', // Was 2xl
          'text-3xl': size === 'medium', // Was 4xl
          'text-5xl': size === 'large', // Was 6xl
        },
        className
      )}
      {...props}
    >
      Cosmic Hoops
    </div>
  );
}
