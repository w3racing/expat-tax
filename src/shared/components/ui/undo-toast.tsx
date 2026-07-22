import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'

type UndoPayload = {
  message: string
  onUndo: () => void
  durationMs?: number
}

type UndoToastContextValue = {
  showUndo: (payload: UndoPayload) => void
}

const UndoToastContext = createContext<UndoToastContextValue | null>(null)

export function UndoToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(UndoPayload & { id: number }) | null>(null)

  const showUndo = useCallback((payload: UndoPayload) => {
    setToast({ ...payload, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), toast.durationMs ?? 5000)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <UndoToastContext.Provider value={{ showUndo }}>
      {children}
      {toast
        ? createPortal(
            <div
              className={cn(
                'fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center justify-between gap-3',
                'rounded-xl border border-border bg-card px-4 py-3 shadow-lg md:bottom-8',
              )}
              role="status"
            >
              <p className="text-sm text-foreground">{toast.message}</p>
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  toast.onUndo()
                  setToast(null)
                }}
              >
                Undo
              </Button>
            </div>,
            document.body,
          )
        : null}
    </UndoToastContext.Provider>
  )
}

export function useUndoToast() {
  const ctx = useContext(UndoToastContext)
  if (!ctx) {
    throw new Error('useUndoToast must be used within UndoToastProvider')
  }
  return ctx
}
