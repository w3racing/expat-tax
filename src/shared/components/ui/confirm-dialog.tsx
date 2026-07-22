import { useEffect, useId, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  typingGate?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Accessible confirm dialog — focus trap + Escape via Radix Dialog. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  typingGate,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const gateId = useId()
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent
        className="max-w-md"
        onOpenAutoFocus={(e) => {
          if (typingGate) {
            e.preventDefault()
            document.getElementById(gateId)?.focus()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {typingGate ? (
          <div className="space-y-2">
            <Label htmlFor={gateId}>Type {typingGate} to confirm</Label>
            <Input
              autoComplete="off"
              id={gateId}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && typed === typingGate) onConfirm()
              }}
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            disabled={Boolean(typingGate && typed !== typingGate)}
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
