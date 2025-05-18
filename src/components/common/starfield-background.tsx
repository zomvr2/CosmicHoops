import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function StarfieldBackground({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  // Placeholder: In a real implementation, this would have CSS or JS for a starfield.
  // For now, it just ensures the dark background.
  return (
    <div
      className={cn('fixed inset-0 -z-10 bg-background', className)}
      {...props}
    >
      {/* You can add a static image or a subtle gradient here as a simpler alternative */}
      {/* Example: <img src="/path/to/starfield.jpg" className="object-cover w-full h-full opacity-20" /> */}
      {children}
    </div>
  );
}
