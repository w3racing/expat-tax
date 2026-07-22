import { ajxTaxV1Importer } from '@/features/migration/importers/ajx-v1-importer'
import {
  ajxTaxPlannerImporter,
  tryParseAsPlanner,
} from '@/features/migration/importers/ajx-planner-importer'
import type { ImportAdapter } from '@/features/migration/types/import'

const adapters: ImportAdapter[] = [ajxTaxPlannerImporter, ajxTaxV1Importer]

export function listImportAdapters(): ImportAdapter[] {
  return [...adapters]
}

export function getImportAdapter(id: string): ImportAdapter | undefined {
  return adapters.find((adapter) => adapter.id === id)
}

export function resolveAdapterForFile(file: File): ImportAdapter | undefined {
  const name = file.name.toLowerCase()
  return adapters.find((adapter) =>
    adapter.accept.some((token) => {
      if (token.startsWith('.')) {
        return name.endsWith(token)
      }
      return file.type === token
    }),
  )
}

/** Prefer planner when JSON shape matches TaxPlannerState. */
export async function resolveAdapterForContent(
  file: File,
  text: string,
): Promise<ImportAdapter | undefined> {
  if (tryParseAsPlanner(text)) {
    return ajxTaxPlannerImporter
  }
  return resolveAdapterForFile(file)
}

/** Register additional import formats without changing the wizard. */
export function registerImportAdapter(adapter: ImportAdapter): void {
  const index = adapters.findIndex((item) => item.id === adapter.id)
  if (index >= 0) {
    adapters[index] = adapter
    return
  }
  adapters.push(adapter)
}
