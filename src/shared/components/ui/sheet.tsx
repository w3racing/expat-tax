import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentPropsWithoutRef, HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/** Bottom sheet / side drawer for phone and tablet. Built on Dialog for a11y. */
export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export function SheetContent({
  className,
  children,
  side = 'bottom',
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  side?: 'bottom' | 'right' | 'left'
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col gap-4 border border-border bg-card shadow-lg focus:outline-none',
          side === 'bottom' &&
            'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl border-b-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          side === 'right' &&
            'inset-y-0 right-0 h-full w-full max-w-md rounded-l-2xl border-r-0 p-6 sm:w-[400px]',
          side === 'left' &&
            'inset-y-0 left-0 h-full w-full max-w-md rounded-r-2xl border-l-0 p-6 sm:w-[400px]',
          className,
        )}
        {...props}
      >
        {side === 'bottom' ? (
          <div aria-hidden className="mx-auto h-1 w-10 shrink-0 rounded-full bg-border" />
        ) : null}
        {children}
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X aria-hidden className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 pr-10 text-left', className)} {...props} />
}

export function SheetTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('font-display text-lg font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

export function SheetDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
