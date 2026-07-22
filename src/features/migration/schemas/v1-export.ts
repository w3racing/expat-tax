import { z } from 'zod'

const looseRecord = z.record(z.string(), z.unknown())

export const v1EvidenceSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    financialYear: z.string().min(1),
    type: z.string().min(1),
    title: z.string().min(1),
    occurredOn: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    merchant: z.string().optional(),
    checksumSha256: z.string().optional(),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
    sourceUrl: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .passthrough()

export const v1EmployerSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    name: z.string().min(1),
    abn: z.string().optional(),
  })
  .passthrough()

export const v1PayslipSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    employerId: z.union([z.string(), z.number()]).transform(String).optional(),
    financialYear: z.string().min(1),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    gross: z.number().optional(),
    taxWithheld: z.number().optional(),
    net: z.number().optional(),
  })
  .passthrough()

export const v1TripSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    title: z.string().min(1),
    financialYear: z.string().min(1),
    startsOn: z.string().optional(),
    endsOn: z.string().optional(),
    purpose: z.string().optional(),
  })
  .passthrough()

export const v1ClaimSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    financialYear: z.string().min(1),
    category: z.string().min(1),
    label: z.string().min(1),
    notes: z.string().optional(),
    evidenceIds: z.array(z.union([z.string(), z.number()]).transform(String)).optional(),
  })
  .passthrough()

export const v1ExportSchema = z
  .object({
    exportVersion: z.string().min(1),
    exportedAt: z.string().optional(),
    app: z.string().min(1),
    appVersion: z.string().optional(),
    profile: z
      .object({
        id: z.union([z.string(), z.number()]).transform(String).optional(),
        displayName: z.string().optional(),
        email: z.string().optional(),
      })
      .passthrough()
      .optional(),
    employers: z.array(v1EmployerSchema).default([]),
    evidence: z.array(v1EvidenceSchema).default([]),
    payslips: z.array(v1PayslipSchema).default([]),
    trips: z.array(v1TripSchema).default([]),
    claims: z.array(v1ClaimSchema).default([]),
    notes: z
      .array(
        z
          .object({
            id: z.union([z.string(), z.number()]).transform(String),
            body: z.string().min(1),
            financialYear: z.string().optional(),
          })
          .passthrough(),
      )
      .default([]),
    tags: z
      .array(
        z
          .object({
            id: z.union([z.string(), z.number()]).transform(String),
            name: z.string().min(1),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough()

export type V1Export = z.infer<typeof v1ExportSchema>

export function isV1ExportVersion(version: string): boolean {
  return /^1(\.|$)/.test(version.trim())
}

export function stripKnownKeys(
  row: Record<string, unknown>,
  known: string[],
): Record<string, unknown> | undefined {
  const rest: Record<string, unknown> = { ...row }
  for (const key of known) {
    delete rest[key]
  }
  return Object.keys(rest).length > 0 ? rest : undefined
}

export { looseRecord }
