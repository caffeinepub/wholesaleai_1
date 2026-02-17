import * as React from 'react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * OpaqueCard - A fully opaque card wrapper that enforces solid backgrounds
 * without any transparency or blur effects in both light and dark themes.
 */

type OpaqueCardProps = React.ComponentPropsWithoutRef<typeof Card>;

export const OpaqueCard = React.forwardRef<
  React.ElementRef<typeof Card>,
  OpaqueCardProps
>(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      'opaque-card',
      className
    )}
    {...props}
  />
));
OpaqueCard.displayName = 'OpaqueCard';

// Re-export other Card components for convenience
export { CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
