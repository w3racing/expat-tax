import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { useUndoToast } from '@/shared/components/ui/undo-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import type {
  BankAccount,
  TaxPlannerState,
  TaxYearRecord,
} from '@/features/tax-position/engine/types'
import { formatAud } from '@/shared/lib/format'

type InterestIncomeEditorProps = {
  planner: TaxPlannerState
  year: TaxYearRecord
  onChange: (planner: TaxPlannerState) => void
}

const cellInputClass = 'h-9 min-w-[5.5rem] font-normal'

function accountLabel(accounts: BankAccount[], id: string | undefined): string {
  if (!id) return 'Unassigned account'
  return accounts.find((a) => a.id === id)?.label ?? 'Unknown account'
}

function accountDetail(accounts: BankAccount[], id: string | undefined): string {
  if (!id) return 'Unassigned account'
  const account = accounts.find((a) => a.id === id)
  if (!account) return 'Unknown account'
  return account.institution ? `${account.label} · ${account.institution}` : account.label
}

function patchYear(
  planner: TaxPlannerState,
  year: TaxYearRecord,
  nextYear: TaxYearRecord,
  bankAccounts?: BankAccount[],
): TaxPlannerState {
  const years = [...planner.years]
  const idx = years.findIndex((y) => y.fyEndYear === year.fyEndYear)
  if (idx >= 0) years[idx] = nextYear
  else years.push(nextYear)
  return {
    ...planner,
    bankAccounts: bankAccounts ?? planner.bankAccounts,
    years,
  }
}

export function InterestIncomeEditor({ planner, year, onChange }: InterestIncomeEditorProps) {
  const { showUndo } = useUndoToast()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [addAccountOpen, setAddAccountOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newInstitution, setNewInstitution] = useState('')
  const [labelError, setLabelError] = useState<string | null>(null)

  const accounts = [...planner.bankAccounts].sort((a, b) => a.sortOrder - b.sortOrder)
  const usedAccountIds = new Set(
    year.interestByAccount.map((row) => row.bankAccountId).filter(Boolean),
  )
  const unusedAccounts = accounts.filter((account) => !usedAccountIds.has(account.id))
  const pendingRow = year.interestByAccount.find((row) => row.id === pendingDeleteId)
  const totalGross = year.interestByAccount.reduce((s, r) => s + r.grossInterestAud, 0)

  const openAddAccount = () => {
    setNewLabel('')
    setNewInstitution('')
    setLabelError(null)
    setAddAccountOpen(true)
  }

  const addInterestForAccount = (bankAccountId: string, bankAccounts = planner.bankAccounts) => {
    onChange(
      patchYear(
        planner,
        year,
        {
          ...year,
          interestByAccount: [
            ...year.interestByAccount,
            {
              id: crypto.randomUUID(),
              bankAccountId,
              grossInterestAud: 0,
              tfnWithheldAud: 0,
            },
          ],
        },
        bankAccounts,
      ),
    )
  }

  const updateEntry = (
    index: number,
    patch: Partial<TaxYearRecord['interestByAccount'][number]>,
  ) => {
    const interestByAccount = [...year.interestByAccount]
    interestByAccount[index] = { ...interestByAccount[index], ...patch }
    onChange(patchYear(planner, year, { ...year, interestByAccount }))
  }

  const submitNewAccount = () => {
    const label = newLabel.trim()
    if (!label) {
      setLabelError('Enter an account name')
      return
    }
    const sortOrder =
      accounts.length === 0 ? 0 : Math.max(...accounts.map((a) => a.sortOrder)) + 1
    const account: BankAccount = {
      id: crypto.randomUUID(),
      label,
      institution: newInstitution.trim() || undefined,
      sortOrder,
    }
    const nextAccounts = [...planner.bankAccounts, account]
    addInterestForAccount(account.id, nextAccounts)
    setAddAccountOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Gross interest is assessable income and counts toward this year’s total.
        </p>
        <Button size="sm" variant="soft" onClick={openAddAccount}>
          Add account
        </Button>
      </div>

      {year.interestByAccount.length === 0 ? (
        <EmptyState
          actionLabel="Add account"
          description="Add each bank account and enter the interest earned this financial year. Amounts are in AUD and count toward total income."
          title="No interest income"
          onAction={openAddAccount}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Gross interest (AUD)</TableHead>
                <TableHead className="w-[1%] text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {year.interestByAccount.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground">
                    {accountDetail(accounts, row.bankAccountId)}
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Gross interest for ${accountLabel(accounts, row.bankAccountId)}`}
                      className={`${cellInputClass} text-right text-amount`}
                      inputMode="decimal"
                      type="number"
                      value={row.grossInterestAud}
                      onChange={(e) =>
                        updateEntry(index, { grossInterestAud: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      aria-label={`Remove interest for ${accountLabel(accounts, row.bankAccountId)}`}
                      className="text-muted-foreground hover:text-destructive"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDeleteId(row.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">Total interest {formatAud(totalGross)}</p>
        </>
      )}

      <Dialog
        open={addAccountOpen}
        onOpenChange={(open) => {
          if (!open) setLabelError(null)
          setAddAccountOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add bank account</DialogTitle>
            <DialogDescription>
              The account appears in this year’s interest list straight away so you can enter
              amounts.
            </DialogDescription>
          </DialogHeader>
          {unusedAccounts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Use an existing account</p>
              <ul className="space-y-1">
                {unusedAccounts.map((account) => (
                  <li key={account.id}>
                    <Button
                      className="h-auto w-full justify-start px-3 py-2 text-left"
                      variant="outline"
                      onClick={() => {
                        addInterestForAccount(account.id)
                        setAddAccountOpen(false)
                      }}
                    >
                      <span className="font-medium text-foreground">{account.label}</span>
                      {account.institution ? (
                        <span className="ml-1 text-muted-foreground">· {account.institution}</span>
                      ) : null}
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="pt-1 text-xs text-muted-foreground">Or create a new account</p>
            </div>
          ) : null}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank-account-label">Account name</Label>
              <Input
                autoFocus
                id="bank-account-label"
                placeholder="e.g. Everyday savings"
                value={newLabel}
                onChange={(e) => {
                  setNewLabel(e.target.value)
                  setLabelError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewAccount()
                }}
              />
              {labelError ? <p className="text-xs text-destructive">{labelError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-account-institution">Institution (optional)</Label>
              <Input
                id="bank-account-institution"
                placeholder="e.g. CBA"
                value={newInstitution}
                onChange={(e) => setNewInstitution(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewAccount()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddAccountOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitNewAccount}>Add account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Remove"
        description={
          pendingRow
            ? `This removes interest for ${accountLabel(accounts, pendingRow.bankAccountId)} from this year’s income. You can undo immediately after.`
            : 'This removes the interest entry from this year’s income. You can undo immediately after.'
        }
        destructive
        open={pendingDeleteId != null}
        title="Remove interest entry?"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return
          const id = pendingDeleteId
          const plannerBefore = planner
          const removed = year.interestByAccount.find((row) => row.id === id)
          onChange(
            patchYear(planner, year, {
              ...year,
              interestByAccount: year.interestByAccount.filter((row) => row.id !== id),
            }),
          )
          setPendingDeleteId(null)
          showUndo({
            message: removed
              ? `Removed interest for ${accountLabel(accounts, removed.bankAccountId)}`
              : 'Interest entry removed',
            onUndo: () => onChange(plannerBefore),
          })
        }}
      />
    </div>
  )
}
