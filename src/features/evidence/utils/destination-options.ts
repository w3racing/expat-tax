import { loadPlanner } from '@/shared/lib/local-data-store'
import type { EvidenceDestinationOption } from '@/features/evidence/types/evidence'

/** Destinations from the overnight planner catalogue — optional evidence organisation only. */
export function listDestinationOptions(fyEndYear: number): EvidenceDestinationOption[] {
  const planner = loadPlanner(fyEndYear)
  return [...planner.destinations]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((d) => ({ id: d.id, name: d.name }))
}
