import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { parseDailyRateInput } from '@/features/overnight-planner/utils/parse-nights'

type AddDestinationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (name: string, dailyRateAud: number) => void
}

export function AddDestinationDialog({ open, onOpenChange, onAdd }: AddDestinationDialogProps) {
  const [name, setName] = useState('')
  const [rateText, setRateText] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [rateError, setRateError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setRateText('')
    setNameError(null)
    setRateError(null)
  }

  const submit = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError('Enter a destination name')
      return
    }
    const parsed = parseDailyRateInput(rateText === '' ? '0' : rateText)
    if (!parsed.ok) {
      setRateError(parsed.error)
      return
    }
    onAdd(trimmedName, parsed.rate)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add destination</DialogTitle>
          <DialogDescription>
            Destinations become columns in the overnight planner. Set the daily rate used for claim
            totals (nights × rate), same as AJX Calculator.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="dest-name">Destination</Label>
            <Input
              autoFocus
              id="dest-name"
              placeholder="e.g. Japan"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
            {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dest-rate">Daily rate (AUD)</Label>
            <Input
              id="dest-rate"
              inputMode="decimal"
              placeholder="e.g. 185"
              value={rateText}
              onChange={(e) => {
                const next = e.target.value
                setRateText(next)
                if (next === '') {
                  setRateError(null)
                  return
                }
                const parsed = parseDailyRateInput(next)
                setRateError(parsed.ok ? null : parsed.error)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
            {rateError ? <p className="text-sm text-destructive">{rateError}</p> : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add destination</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
