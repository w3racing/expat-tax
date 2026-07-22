import type { Transition, Variants } from 'framer-motion'

export const duration = {
  fast: 0.15,
  normal: 0.22,
  slow: 0.32,
} as const

export const easeOut = [0.16, 1, 0.3, 1] as const

export const transitionFast: Transition = {
  duration: duration.fast,
  ease: easeOut,
}

export const transitionNormal: Transition = {
  duration: duration.normal,
  ease: easeOut,
}

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
}

export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 2 },
}

export const scaleInVariants: Variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
}

export const fabTap = { scale: 0.96 }
