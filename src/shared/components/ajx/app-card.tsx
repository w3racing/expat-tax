import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card'

type AppCardProps = HTMLAttributes<HTMLDivElement> & {
  header?: ReactNode
  footer?: ReactNode
}

export function AppCard({ header, footer, className, children, ...props }: AppCardProps) {
  return (
    <Card className={cn(className)} {...props}>
      {header ? <CardHeader className="pb-3">{header}</CardHeader> : null}
      <CardContent className={cn(!header && 'pt-4 md:pt-5')}>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  )
}
