const STORAGE_KEY = 'ajx.evidence-gaps.dismissed.v1'

type DismissedStore = Record<string, string[]>

function readStore(): DismissedStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DismissedStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: DismissedStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function fyKey(fyEndYear: number): string {
  return String(fyEndYear)
}

export function listDismissedClaimIds(fyEndYear: number): Set<string> {
  const ids = readStore()[fyKey(fyEndYear)] ?? []
  return new Set(ids)
}

export function dismissClaimGap(fyEndYear: number, claimId: string): void {
  const store = readStore()
  const key = fyKey(fyEndYear)
  const next = new Set(store[key] ?? [])
  next.add(claimId)
  store[key] = [...next]
  writeStore(store)
}

export function restoreClaimGap(fyEndYear: number, claimId: string): void {
  const store = readStore()
  const key = fyKey(fyEndYear)
  store[key] = (store[key] ?? []).filter((id) => id !== claimId)
  if (store[key].length === 0) delete store[key]
  writeStore(store)
}
