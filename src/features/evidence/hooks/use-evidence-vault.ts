import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFy } from '@/app/providers/fy-provider'
import type {
  EvidenceCategory,
  EvidenceMetadataPatch,
  EvidenceRecord,
  EvidenceUploadInput,
} from '@/features/evidence/types/evidence'
import {
  filterEvidence,
  listEvidenceRecords,
  softDeleteEvidenceRecord,
  restoreEvidenceRecord,
  updateEvidenceRecord,
  uploadEvidence,
  replaceEvidenceFile,
} from '@/features/evidence/services/evidence-vault'
import { listClaimOptions } from '@/features/evidence/utils/claim-options'
import { listDestinationOptions } from '@/features/evidence/utils/destination-options'
import { fyMonthKeys } from '@/features/overnight-planner/utils/fy-months'

type UploadArgs = Omit<EvidenceUploadInput, 'fyEndYear'> & { fyEndYear?: number }

export function useEvidenceVault() {
  const { fyEndYear, label } = useFy()
  const [tick, setTick] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<EvidenceCategory | 'all'>('all')
  const [monthKey, setMonthKey] = useState<string | 'all'>('all')
  const [destinationId, setDestinationId] = useState<string | 'all'>('all')
  const [tag, setTag] = useState<string | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    const id = window.setTimeout(() => setLoading(false), 120)
    return () => window.clearTimeout(id)
  }, [fyEndYear, tick])

  const all = useMemo(() => {
    void tick
    return listEvidenceRecords(fyEndYear)
  }, [fyEndYear, tick])

  const items = useMemo(
    () => filterEvidence(all, { query, category, monthKey, destinationId, tag }),
    [all, query, category, monthKey, destinationId, tag],
  )

  const selected = useMemo(
    () => (selectedId ? (all.find((i) => i.id === selectedId) ?? null) : null),
    [all, selectedId],
  )

  const claimOptions = useMemo(() => listClaimOptions(fyEndYear), [fyEndYear, tick])
  const destinationOptions = useMemo(() => listDestinationOptions(fyEndYear), [fyEndYear, tick])
  const monthOptions = useMemo(() => fyMonthKeys(fyEndYear), [fyEndYear])
  const tagOptions = useMemo(() => {
    const set = new Set<string>()
    for (const item of all) for (const t of item.tags) set.add(t)
    return [...set].sort()
  }, [all])

  const upload = useCallback(
    async (input: UploadArgs) => {
      const payload: EvidenceUploadInput = {
        file: input.file,
        category: input.category,
        documentDate: input.documentDate,
        monthKey: input.monthKey,
        description: input.description,
        tags: input.tags,
        linkedClaimId: input.linkedClaimId,
        linkedClaimLabel: input.linkedClaimLabel,
        destinationId: input.destinationId,
        destinationName: input.destinationName,
        title: input.title,
        fyEndYear: input.fyEndYear ?? fyEndYear,
      }
      const record = await uploadEvidence(payload)
      refresh()
      setSelectedId(record.id)
      return record
    },
    [fyEndYear, refresh],
  )

  const update = useCallback(
    (id: string, patch: EvidenceMetadataPatch) => {
      const next = updateEvidenceRecord(id, patch)
      refresh()
      return next
    },
    [refresh],
  )

  const replace = useCallback(
    async (id: string, file: File) => {
      const next = await replaceEvidenceFile(id, file)
      refresh()
      return next
    },
    [refresh],
  )

  const remove = useCallback(
    (id: string) => {
      softDeleteEvidenceRecord(id)
      if (selectedId === id) setSelectedId(null)
      refresh()
    },
    [refresh, selectedId],
  )

  const restore = useCallback(
    (id: string) => {
      restoreEvidenceRecord(id)
      refresh()
    },
    [refresh],
  )

  const clearFilters = useCallback(() => {
    setQuery('')
    setCategory('all')
    setMonthKey('all')
    setDestinationId('all')
    setTag('all')
  }, [])

  return {
    fyEndYear,
    label,
    loading,
    items,
    allCount: all.length,
    query,
    setQuery,
    category,
    setCategory,
    monthKey,
    setMonthKey,
    monthOptions,
    destinationId,
    setDestinationId,
    destinationOptions,
    tag,
    setTag,
    tagOptions,
    selected,
    setSelectedId,
    claimOptions,
    upload,
    update,
    replace,
    remove,
    restore,
    refresh,
    clearFilters,
  }
}

export type { EvidenceRecord }
