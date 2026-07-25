import {
  claimAud,
  ENGINE_VERSION,
  foreignToAud,
  type TaxPlannerState,
  type TaxYearRecord,
  type TaxYearSummary,
} from '@/features/tax-position/engine'
import { buildCalculationTraces } from '@/features/tax-position/engine/traces'
import { buildOvernightClaimProvenance } from '@/features/tax-position/utils/overnight-claim-provenance'
import type { EvidenceRecord } from '@/features/evidence/types/evidence'
import { categoryLabel } from '@/features/evidence/types/evidence'
import type { SampleDay } from '@/features/destination-workspace/types/sample-day'
import type { ClaimLine, TaxpayerDetails } from '@/features/export/types/accountant-package'
import {
  AUDIT_DISCLAIMER,
  AUDIT_PACKAGE_VERSION,
  AUDIT_RULESET_VERSION,
  type AuditPackageData,
  type AuditPackageOptions,
  type AuditThumbnail,
  type CurrencyConversionRow,
  type EvidenceRegisterRow,
} from '@/features/audit/types/audit-package'
import { auditSectionForEvidence, auditZipFolderForEvidence } from '@/features/audit/utils/categorize-evidence'
import { buildAuditReadiness } from '@/features/audit/utils/build-audit-readiness'

function buildClaimLines(year: TaxYearRecord, evidence: EvidenceRecord[]): ClaimLine[] {
  const linked = new Set(
    evidence.map((e) => e.linkedClaimId).filter((id): id is string => Boolean(id)),
  )
  const lines: ClaimLine[] = []

  for (const c of year.otherClaims) {
    lines.push({
      id: c.id,
      category: 'Work expense',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Work-related expense',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.amountAud,
      }),
      currencyNote: c.currencyCode !== 'AUD' ? `${c.currencyCode} ${c.localAmount}` : undefined,
      linkedEvidence: linked.has(c.id),
    })
  }
  for (const c of year.flights) {
    lines.push({
      id: c.id,
      category: 'Flight',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Flight',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage),
      currencyNote: c.currencyCode !== 'AUD' ? `${c.currencyCode} ${c.localAmount}` : undefined,
      linkedEvidence: linked.has(c.id),
    })
  }
  for (const c of year.transport) {
    lines.push({
      id: c.id,
      category: 'Transport',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Transport',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.audAmount,
      }),
      currencyNote: c.currencyCode !== 'AUD' ? `${c.currencyCode} ${c.localAmount}` : undefined,
      linkedEvidence: linked.has(c.id),
    })
  }
  let remainingCarKm = 5000
  for (const c of year.carKm) {
    const claimable = Math.min(c.kilometres, remainingCarKm)
    remainingCarKm -= claimable
    lines.push({
      id: c.id,
      category: 'Car (cents/km)',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || `${c.kilometres} km @ ${c.centsPerKm}¢`,
      amountAud: (claimable * c.centsPerKm) / 100,
      linkedEvidence: linked.has(c.id),
    })
  }
  for (const c of year.laundry) {
    lines.push({
      id: c.id,
      category: 'Laundry',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Laundry',
      amountAud: claimAud(c.localAmount, c.exchangeRate, 100),
      currencyNote: `JPY ${c.localAmount}`,
      linkedEvidence: linked.has(c.id),
    })
  }
  for (const c of year.apartmentCosts) {
    lines.push({
      id: c.id,
      category: 'Apartment',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || c.kind,
      amountAud: claimAud(c.localAmount, c.exchangeRate, 100),
      currencyNote: `JPY ${c.localAmount}`,
      linkedEvidence: linked.has(c.id),
    })
  }

  return lines
}

function buildCurrencySchedule(
  year: TaxYearRecord,
  sampleDays: SampleDay[],
): CurrencyConversionRow[] {
  const rows: CurrencyConversionRow[] = []

  for (const m of year.monthlyIncome) {
    if (!(m.incomeUsd > 0)) continue
    rows.push({
      id: m.id,
      source: 'Employment income',
      dateYmd: `${m.monthKey}-01`,
      description: `Employment ${m.monthKey}`,
      currencyCode: 'USD',
      localAmount: m.incomeUsd,
      exchangeRate: m.usdAudRate,
      amountAud: m.usdAudRate > 0 ? m.incomeUsd / m.usdAudRate : 0,
      rateFromAto: m.usdAudFromAto,
    })
  }

  const pushClaim = (
    id: string,
    source: string,
    dateYmd: string | undefined,
    description: string,
    currencyCode: string,
    localAmount: number,
    exchangeRate: number,
    amountAud: number,
    rateFromAto?: boolean,
  ) => {
    if (currencyCode === 'AUD' || !(localAmount > 0)) return
    rows.push({
      id,
      source,
      dateYmd,
      description,
      currencyCode,
      localAmount,
      exchangeRate,
      amountAud,
      rateFromAto,
    })
  }

  for (const c of year.otherClaims) {
    pushClaim(
      c.id,
      'Work expense',
      c.dateYmd,
      c.description?.trim() || 'Work expense',
      c.currencyCode,
      c.localAmount,
      c.exchangeRate,
      claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.amountAud,
      }),
      c.rateFromAto,
    )
  }
  for (const c of year.flights) {
    pushClaim(
      c.id,
      'Flight',
      c.dateYmd,
      c.description?.trim() || 'Flight',
      c.currencyCode,
      c.localAmount,
      c.exchangeRate,
      claimAud(c.localAmount, c.exchangeRate, c.workPercentage),
      c.rateFromAto,
    )
  }
  for (const c of year.transport) {
    pushClaim(
      c.id,
      'Transport',
      c.dateYmd,
      c.description?.trim() || 'Transport',
      c.currencyCode,
      c.localAmount,
      c.exchangeRate,
      claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.audAmount,
      }),
      c.rateFromAto,
    )
  }
  for (const c of year.laundry) {
    pushClaim(
      c.id,
      'Laundry',
      c.dateYmd,
      c.description?.trim() || 'Laundry',
      'JPY',
      c.localAmount,
      c.exchangeRate,
      foreignToAud(c.localAmount, c.exchangeRate),
      c.rateFromAto,
    )
  }
  for (const c of year.apartmentCosts) {
    pushClaim(
      c.id,
      'Apartment',
      c.dateYmd,
      c.description?.trim() || c.kind,
      'JPY',
      c.localAmount,
      c.exchangeRate,
      foreignToAud(c.localAmount, c.exchangeRate),
      c.rateFromAto,
    )
  }

  for (const day of sampleDays) {
    for (const r of day.receipts) {
      if (r.currencyCode === 'AUD' || !(r.localAmount > 0)) continue
      rows.push({
        id: r.id,
        source: `Sample day · ${day.label}`,
        description: r.description || r.category,
        currencyCode: r.currencyCode,
        localAmount: r.localAmount,
        exchangeRate: r.exchangeRate,
        amountAud: r.amountAud,
      })
    }
  }

  return rows
}

function buildThumbnails(
  evidence: EvidenceRecord[],
  sampleDays: SampleDay[],
  include: boolean,
): AuditThumbnail[] {
  if (!include) return []
  const out: AuditThumbnail[] = []

  for (const day of sampleDays) {
    for (const r of day.receipts) {
      if (!r.imageDataUrl?.startsWith('data:image/')) continue
      out.push({
        id: r.id,
        label: `${day.label} · ${r.description || r.category}`,
        dataUrl: r.imageDataUrl,
        source: 'sample_receipt',
      })
    }
  }

  for (const item of evidence) {
    if (!item.dataUrl?.startsWith('data:image/')) continue
    out.push({
      id: item.id,
      label: item.title || item.fileName,
      dataUrl: item.dataUrl,
      source: 'evidence',
    })
  }

  return out.slice(0, 40)
}

function buildEvidenceRegister(
  evidence: EvidenceRecord[],
  year: TaxYearRecord | undefined,
  destinations: TaxPlannerState['destinations'],
  sampleDays: SampleDay[],
): EvidenceRegisterRow[] {
  const rows = evidence.map((item) => ({
    id: item.id,
    fileName: item.fileName,
    category: categoryLabel(item.category),
    zipSection: auditSectionForEvidence(item, year),
    zipFolder: auditZipFolderForEvidence(item, year, destinations, sampleDays),
    linkedClaim: item.linkedClaimLabel,
    documentDate: item.documentDate,
    uploadDate: item.createdAt,
    processingStatus: item.processingStatus,
    hasBinary: Boolean(item.dataUrl),
  }))
  return rows.sort((a, b) => {
    const folder = a.zipFolder.localeCompare(b.zipFolder)
    if (folder !== 0) return folder
    const da = a.documentDate ?? a.uploadDate
    const db = b.documentDate ?? b.uploadDate
    return da.localeCompare(db)
  })
}

/**
 * Assemble audit package DTO from Tax Position + Evidence Vault.
 * Read-only over calculation inputs — never mutates planner maths.
 */
export function buildAuditPackageData(input: {
  taxpayer: TaxpayerDetails
  fyEndYear: number
  fyLabel: string
  planner: TaxPlannerState
  summary: TaxYearSummary
  evidence: EvidenceRecord[]
  sampleDays: SampleDay[]
  options?: Partial<AuditPackageOptions>
}): AuditPackageData {
  const options: AuditPackageOptions = {
    includeReceiptThumbnails: input.options?.includeReceiptThumbnails ?? false,
  }
  const year = input.planner.years.find((y) => y.fyEndYear === input.fyEndYear)
  const claims = year ? buildClaimLines(year, input.evidence) : []
  const s = input.summary
  const overnightClaim = buildOvernightClaimProvenance({
    fyEndYear: input.fyEndYear,
    planner: input.planner,
    sampleDays: input.sampleDays,
  })
  const readiness = buildAuditReadiness({
    fyEndYear: input.fyEndYear,
    planner: input.planner,
    evidence: input.evidence,
    sampleDays: input.sampleDays,
  })
  const traces = buildCalculationTraces(input.planner, input.fyEndYear)

  return {
    packageId: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    packageVersion: AUDIT_PACKAGE_VERSION,
    rulesetVersion: AUDIT_RULESET_VERSION,
    fyEndYear: input.fyEndYear,
    fyLabel: input.fyLabel,
    taxpayer: input.taxpayer,
    options,
    income: [
      { label: 'Employment income', amountAud: s.employmentIncomeAud },
      { label: 'Interest', amountAud: s.interestIncomeAud },
      { label: 'Dividends (incl. franking)', amountAud: s.dividendIncomeAud },
      { label: 'Rental (net)', amountAud: s.rentalIncomeAud },
      { label: 'Capital gains (net)', amountAud: s.capitalGainsAud },
      { label: 'Other investment income', amountAud: s.otherInvestmentAud },
      { label: 'Total income', amountAud: s.totalIncomeAud },
    ],
    expenses: [
      { label: 'Superannuation', amountAud: s.superannuationAud },
      { label: 'Overseas overnight claim', amountAud: s.overseasDailyAud },
      { label: 'Work expenses', amountAud: s.otherClaimsAud },
      { label: 'Flights', amountAud: s.flightsAud },
      { label: 'Transport', amountAud: s.transportAud },
      { label: 'Car (cents per km)', amountAud: s.carKmAud },
      { label: 'Laundry', amountAud: s.laundryAud },
      { label: 'Apartment costs', amountAud: s.apartmentCostsAud },
      { label: 'Total deductions / claims', amountAud: s.totalClaimsAud },
    ],
    claims,
    summary: s,
    overnightClaim,
    sampleDays: input.sampleDays,
    currencyConversions: year ? buildCurrencySchedule(year, input.sampleDays) : [],
    evidenceRegister: buildEvidenceRegister(
      input.evidence,
      year,
      input.planner.destinations,
      input.sampleDays,
    ),
    evidence: input.evidence,
    traces,
    readiness,
    thumbnails: buildThumbnails(input.evidence, input.sampleDays, options.includeReceiptThumbnails),
    notes: year?.notes?.trim() ?? '',
    disclaimer: AUDIT_DISCLAIMER,
  }
}
