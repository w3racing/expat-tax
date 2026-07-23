import {
  averageDailySpendAud,
  normalizeSampleDay,
  computeReceiptAud,
  createEmptyReceipt,
  type SampleDay,
  type SampleDayReceipt,
} from '@/features/destination-workspace/types/sample-day'
import { upsertDestinationRate } from '@/features/overnight-planner/utils/overnight-matrix'
import type { TaxPlannerState } from '@/features/tax-position/engine/types'
import { saveTaxPlanner } from '@/features/tax-position/services/position-service'

const STORE_KEY = 'ajx.sample-days.v1'
/** Soft cap for compressed receipt photo data URLs in local storage */
export const MAX_RECEIPT_IMAGE_BYTES = 400 * 1024
/** Camera / library originals can be larger — we resize before storing */
export const MAX_RECEIPT_SOURCE_BYTES = 12 * 1024 * 1024
/** Longest edge after resize — readable on phone, small in storage */
const RECEIPT_IMAGE_MAX_EDGE = 1280
const RECEIPT_JPEG_QUALITY_START = 0.72
const RECEIPT_JPEG_QUALITY_FLOOR = 0.4

type SampleDayStore = {
  days: SampleDay[]
}

function readStore(): SampleDayStore {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return { days: [] }
    const parsed = JSON.parse(raw) as SampleDayStore
    const days = Array.isArray(parsed.days)
      ? parsed.days.map((d) => normalizeSampleDay(d as SampleDay & Record<string, unknown>))
      : []
    return { days }
  } catch {
    return { days: [] }
  }
}

function writeStore(store: SampleDayStore) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function listSampleDays(fyEndYear: number, destinationId: string): SampleDay[] {
  return readStore()
    .days.filter((d) => d.fyEndYear === fyEndYear && d.destinationId === destinationId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** All sample days for a financial year, newest first. */
export function listSampleDaysForFy(fyEndYear: number): SampleDay[] {
  return readStore()
    .days.filter((d) => d.fyEndYear === fyEndYear)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Replace sample days for a FY (preserves days from other years). */
export function replaceSampleDaysForFy(fyEndYear: number, days: SampleDay[]): void {
  const store = readStore()
  const others = store.days.filter((d) => d.fyEndYear !== fyEndYear)
  writeStore({ days: [...days, ...others] })
}

export function getSampleDay(id: string): SampleDay | null {
  return readStore().days.find((d) => d.id === id) ?? null
}

export function createSampleDay(input: {
  destinationId: string
  fyEndYear: number
  label?: string
}): SampleDay {
  const now = new Date().toISOString()
  const existing = listSampleDays(input.fyEndYear, input.destinationId)
  const day: SampleDay = {
    id: crypto.randomUUID(),
    destinationId: input.destinationId,
    fyEndYear: input.fyEndYear,
    label: input.label?.trim() || `Sample day ${existing.length + 1}`,
    status: 'in_progress',
    notes: '',
    receipts: [],
    linkedEvidenceIds: [],
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  const store = readStore()
  store.days.unshift(day)
  writeStore(store)
  return day
}

export function updateSampleDay(
  id: string,
  patch: Partial<
    Pick<SampleDay, 'label' | 'receipts' | 'status' | 'completedAt' | 'notes' | 'linkedEvidenceIds'>
  >,
): SampleDay | null {
  const store = readStore()
  const idx = store.days.findIndex((d) => d.id === id)
  if (idx < 0) return null
  const current = store.days[idx]!
  const next: SampleDay = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  store.days[idx] = next
  writeStore(store)
  return next
}

export function addReceipt(
  sampleDayId: string,
  receipt?: Partial<Omit<SampleDayReceipt, 'id'>> & { id?: string },
): SampleDay | null {
  const day = getSampleDay(sampleDayId)
  if (!day || day.status === 'complete') return null
  const last = day.receipts[0]
  const base = createEmptyReceipt({
    currencyCode: receipt?.currencyCode ?? last?.currencyCode ?? 'AUD',
    category: receipt?.category ?? last?.category ?? 'meals',
    exchangeRate: receipt?.exchangeRate ?? last?.exchangeRate,
  })
  const currencyCode = receipt?.currencyCode ?? base.currencyCode
  const localAmount = receipt?.localAmount ?? 0
  const exchangeRate =
    receipt?.exchangeRate ?? (currencyCode === 'AUD' ? 1 : base.exchangeRate)
  const nextReceipt: SampleDayReceipt = {
    ...base,
    id: receipt?.id ?? crypto.randomUUID(),
    description: receipt?.description ?? '',
    category: receipt?.category ?? base.category,
    currencyCode,
    localAmount,
    exchangeRate,
    amountAud: computeReceiptAud(localAmount, currencyCode, exchangeRate),
    notes: receipt?.notes ?? '',
    imageDataUrl: receipt?.imageDataUrl ?? null,
    imageFileName: receipt?.imageFileName ?? null,
    evidenceId: receipt?.evidenceId ?? null,
  }
  return updateSampleDay(sampleDayId, {
    receipts: [nextReceipt, ...day.receipts],
  })
}

export function updateReceipt(
  sampleDayId: string,
  receiptId: string,
  patch: Partial<Omit<SampleDayReceipt, 'id'>>,
): SampleDay | null {
  const day = getSampleDay(sampleDayId)
  if (!day || day.status === 'complete') return null
  return updateSampleDay(sampleDayId, {
    receipts: day.receipts.map((r) => {
      if (r.id !== receiptId) return r
      const currencyCode = patch.currencyCode ?? r.currencyCode
      const localAmount = patch.localAmount ?? r.localAmount
      const exchangeRate =
        patch.exchangeRate ??
        (currencyCode === 'AUD' ? 1 : r.exchangeRate > 0 ? r.exchangeRate : 1)
      return {
        ...r,
        ...patch,
        currencyCode,
        localAmount,
        exchangeRate,
        amountAud: computeReceiptAud(localAmount, currencyCode, exchangeRate),
      }
    }),
  })
}

export function removeReceipt(sampleDayId: string, receiptId: string): SampleDay | null {
  const day = getSampleDay(sampleDayId)
  if (!day || day.status === 'complete') return null
  return updateSampleDay(sampleDayId, {
    receipts: day.receipts.filter((r) => r.id !== receiptId),
  })
}

export function duplicateReceipt(sampleDayId: string, receiptId: string): SampleDay | null {
  const day = getSampleDay(sampleDayId)
  if (!day || day.status === 'complete') return null
  const source = day.receipts.find((r) => r.id === receiptId)
  if (!source) return null
  const copy: SampleDayReceipt = {
    ...source,
    id: crypto.randomUUID(),
    description: source.description ? `${source.description} (copy)` : '',
  }
  const idx = day.receipts.findIndex((r) => r.id === receiptId)
  const receipts = [...day.receipts]
  receipts.splice(idx + 1, 0, copy)
  return updateSampleDay(sampleDayId, { receipts })
}

function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.ceil((base64.length * 3) / 4)
}

function receiptJpegFileName(fileName: string): string {
  const base = (fileName || 'receipt').replace(/\.[^.]+$/, '')
  return `${base || 'receipt'}.jpg`
}

/** Resize + JPEG-compress for local storage — low-res is fine for sample-day evidence. */
export async function readReceiptImageAsDataUrl(file: File): Promise<{
  dataUrl: string
  fileName: string
}> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(
      Object.assign(new Error('Please choose a photo or image'), { code: 'UPLOAD_FAILED' }),
    )
  }
  if (file.size > MAX_RECEIPT_SOURCE_BYTES) {
    return Promise.reject(
      Object.assign(new Error('Photo is too large (max about 12 MB)'), {
        code: 'UPLOAD_FAILED',
      }),
    )
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return Promise.reject(
      Object.assign(new Error('Could not read that image. Try a JPG or PNG.'), {
        code: 'UPLOAD_FAILED',
      }),
    )
  }

  try {
    const scale = Math.min(1, RECEIPT_IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return Promise.reject(
        Object.assign(new Error('Could not process that photo'), { code: 'UPLOAD_FAILED' }),
      )
    }
    ctx.drawImage(bitmap, 0, 0, width, height)

    let quality = RECEIPT_JPEG_QUALITY_START
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (
      dataUrlByteLength(dataUrl) > MAX_RECEIPT_IMAGE_BYTES &&
      quality > RECEIPT_JPEG_QUALITY_FLOOR
    ) {
      quality = Math.max(RECEIPT_JPEG_QUALITY_FLOOR, quality - 0.1)
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }

    if (dataUrlByteLength(dataUrl) > MAX_RECEIPT_IMAGE_BYTES) {
      return Promise.reject(
        Object.assign(new Error('Photo is still too large after compressing. Try another image.'), {
          code: 'UPLOAD_FAILED',
        }),
      )
    }

    return { dataUrl, fileName: receiptJpegFileName(file.name) }
  } finally {
    bitmap.close()
  }
}

export function completeSampleDay(id: string): SampleDay | null {
  const day = getSampleDay(id)
  if (!day) return null
  return updateSampleDay(id, {
    status: 'complete',
    completedAt: new Date().toISOString(),
  })
}

export function reopenSampleDay(id: string): SampleDay | null {
  const day = getSampleDay(id)
  if (!day) return null
  return updateSampleDay(id, {
    status: 'in_progress',
    completedAt: null,
  })
}

export function deleteSampleDay(id: string): void {
  const store = readStore()
  store.days = store.days.filter((d) => d.id !== id)
  writeStore(store)
}

export function setLinkedEvidenceIds(sampleDayId: string, ids: string[]): SampleDay | null {
  const day = getSampleDay(sampleDayId)
  if (!day || day.status === 'complete') return null
  return updateSampleDay(sampleDayId, { linkedEvidenceIds: ids })
}

export function syncDestinationAverageToPlanner(
  planner: TaxPlannerState,
  fyEndYear: number,
  destinationId: string,
): TaxPlannerState {
  const days = listSampleDays(fyEndYear, destinationId)
  const average = averageDailySpendAud(days)
  if (average == null) return planner

  const key = String(fyEndYear)
  const rates = planner.ratesByFy[key] ?? []
  const rounded = Math.round(average * 100) / 100
  return {
    ...planner,
    ratesByFy: {
      ...planner.ratesByFy,
      [key]: upsertDestinationRate(rates, destinationId, rounded),
    },
    activeFyEndYear: fyEndYear,
  }
}

export function syncAverageAndPersist(
  planner: TaxPlannerState,
  fyEndYear: number,
  destinationId: string,
): TaxPlannerState {
  const next = syncDestinationAverageToPlanner(planner, fyEndYear, destinationId)
  if (next === planner) {
    const days = listSampleDays(fyEndYear, destinationId)
    const average = averageDailySpendAud(days)
    if (average == null) {
      saveTaxPlanner(planner, 'user_edit')
      return planner
    }
  }
  saveTaxPlanner(next, 'user_edit')
  return next
}
