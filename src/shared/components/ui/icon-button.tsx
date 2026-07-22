import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'destructive'
}

export function IconButton({
  label,
  className,
  variant = 'ghost',
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      className={cn(className)}
      size="icon"
      title={label}
      variant={variant}
      {...props}
    >
      {children}
    </Button>
  )
}
