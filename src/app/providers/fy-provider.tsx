import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { emptyPlanner } from '@/features/tax-position/engine'
import { loadPlanner, savePlanner } from '@/shared/lib/local-data-store'

/** Australian FY end year (e.g. 2026 = FY 2025–26). */
export function currentFyEndYear(now = new Date()): number {
  const month = now.getMonth() // 0-based
  const year = now.getFullYear()
  return month >= 6 ? year + 1 : year
}

export function fyLabel(fyEndYear: number): string {
  const start = fyEndYear - 1
  return `FY ${start}–${String(fyEndYear).slice(2)}`
}

export function listAvailableFyYears(active: number): number[] {
  const planner = loadPlanner(active)
  const fromPlanner = planner.years.map((y) => y.fyEndYear)
  const current = currentFyEndYear()
  const set = new Set<number>([...fromPlanner, active, current, current - 1])
  return [...set].sort((a, b) => b - a)
}

export function cycleFyYear(active: number, years: number[]): number {
  if (years.length === 0) return active
  const idx = years.indexOf(active)
  if (idx < 0) return years[0]!
  return years[(idx + 1) % years.length]!
}

/** Ensure a FY exists in the planner and make it active. */
export function ensureFinancialYear(fyEndYear: number): void {
  if (!Number.isFinite(fyEndYear) || fyEndYear < 2000 || fyEndYear > 2100) {
    throw new Error('Enter a valid year ending (e.g. 2026 for FY 2025–26).')
  }
  const planner = loadPlanner(fyEndYear)
  if (!planner.years.some((y) => y.fyEndYear === fyEndYear)) {
    const empty = emptyPlanner(fyEndYear)
    savePlanner({
      ...planner,
      years: [...planner.years, empty.years[0]!],
      activeFyEndYear: fyEndYear,
    })
  } else {
    savePlanner({ ...planner, activeFyEndYear: fyEndYear })
  }
}

type FyContextValue = {
  fyEndYear: number
  label: string
  availableYears: number[]
  setFyEndYear: (year: number) => void
  cycleFy: () => void
  /** Create (if needed) and select a financial year */
  createOrSelectFy: (fyEndYear: number) => void
}

const FyContext = createContext<FyContextValue | null>(null)
const STORAGE_KEY = 'ajx.activeFyEndYear'

export function FyProvider({ children }: { children: ReactNode }) {
  const [fyEndYear, setFyEndYearState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const n = Number(stored)
      if (Number.isFinite(n) && n > 2000) return n
    }
    return currentFyEndYear()
  })
  const [listTick, setListTick] = useState(0)

  const setFyEndYear = (year: number) => {
    setFyEndYearState(year)
    localStorage.setItem(STORAGE_KEY, String(year))
  }

  const createOrSelectFy = (year: number) => {
    ensureFinancialYear(year)
    setFyEndYear(year)
    setListTick((t) => t + 1)
  }

  const availableYears = useMemo(() => {
    void listTick
    return listAvailableFyYears(fyEndYear)
  }, [fyEndYear, listTick])

  const cycleFy = () => setFyEndYear(cycleFyYear(fyEndYear, availableYears))

  const value = useMemo(
    () => ({
      fyEndYear,
      label: fyLabel(fyEndYear),
      availableYears,
      setFyEndYear,
      cycleFy,
      createOrSelectFy,
    }),
    [fyEndYear, availableYears],
  )

  return <FyContext.Provider value={value}>{children}</FyContext.Provider>
}

export function useFy() {
  const ctx = useContext(FyContext)
  if (!ctx) {
    throw new Error('useFy must be used within FyProvider')
  }
  return ctx
}
