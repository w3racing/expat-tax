import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { fabTap, springSoft } from '@/shared/lib/motion'

type FloatingActionButtonProps = {
  label?: string
  onClick?: () => void
  className?: string
}

export function FloatingActionButton({
  label = 'Capture',
  onClick,
  className,
}: FloatingActionButtonProps) {
  return (
    <motion.button
      aria-label={label}
      className={cn(
        'fixed z-40 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md',
        'right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
        'md:right-6 md:bottom-6',
        className,
      )}
      onClick={onClick}
      transition={springSoft}
      type="button"
      whileTap={fabTap}
    >
      <Plus aria-hidden className="size-6" strokeWidth={2} />
    </motion.button>
  )
}
