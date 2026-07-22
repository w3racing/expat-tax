import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

const buttonVariants = cva(
  'inline-flex touch-target items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors duration-[var(--duration-fast)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-[var(--ajx-cerulean-700)]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-[var(--ajx-mist-100)]',
        outline: 'border border-border bg-card text-foreground shadow-xs hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        soft: 'bg-primary-soft text-accent-foreground hover:bg-[var(--ajx-cerulean-100)]',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:opacity-90',
      },
      size: {
        sm: 'h-9 min-h-9 px-3 text-xs',
        md: 'h-11 px-4',
        lg: 'h-12 px-5 text-base',
        icon: 'size-11 shrink-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : type}
      {...props}
    />
  )
}

export { buttonVariants }
