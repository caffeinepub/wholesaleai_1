import * as React from 'react';
import {
  DialogContent,
} from '@/components/ui/dialog';
import {
  SheetContent,
} from '@/components/ui/sheet';
import {
  SelectContent,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/**
 * Opaque overlay wrappers for shadcn/ui components.
 * These components force fully opaque backgrounds without blur effects
 * by applying className overrides directly to the content components.
 */

type OpaqueDialogContentProps = React.ComponentPropsWithoutRef<typeof DialogContent>;

export const OpaqueDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  OpaqueDialogContentProps
>(({ className, ...props }, ref) => (
  <DialogContent
    ref={ref}
    className={cn(
      '!bg-card border-border backdrop-blur-none',
      '[&~div]:!bg-background/95 [&~div]:backdrop-blur-none',
      className
    )}
    {...props}
  />
));
OpaqueDialogContent.displayName = 'OpaqueDialogContent';

type OpaqueSheetContentProps = React.ComponentPropsWithoutRef<typeof SheetContent>;

export const OpaqueSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetContent>,
  OpaqueSheetContentProps
>(({ className, ...props }, ref) => (
  <SheetContent
    ref={ref}
    className={cn(
      '!bg-sidebar border-sidebar-border backdrop-blur-none',
      '[&~div]:!bg-background/95 [&~div]:backdrop-blur-none',
      className
    )}
    {...props}
  />
));
OpaqueSheetContent.displayName = 'OpaqueSheetContent';

type OpaqueSelectContentProps = React.ComponentPropsWithoutRef<typeof SelectContent>;

export const OpaqueSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectContent>,
  OpaqueSelectContentProps
>(({ className, ...props }, ref) => (
  <SelectContent
    ref={ref}
    className={cn(
      '!bg-popover border-border backdrop-blur-none',
      className
    )}
    {...props}
  />
));
OpaqueSelectContent.displayName = 'OpaqueSelectContent';
