import { describe, expect, it } from 'vitest'
import { emptyPlanner, summarizeFromPlanner } from '@/features/tax-position/engine'
import { buildAuditPackageData } from '@/features/audit/utils/build-audit-package-data'
import { buildAuditReadiness } from '@/features/audit/utils/build-audit-readiness'
import {
  auditSectionForEvidence,
  auditZipFolderForEvidence,
  inferTransportFolderFromText,
  travelSubfolderForSampleDay,
} from '@/features/audit/utils/categorize-evidence'
import type { SampleDay } from '@/features/destination-workspace/types/sample-day'
import { generateAuditReportPdf } from '@/features/audit/services/generate-audit-report-pdf'
import { sha256HexFromText } from '@/features/audit/utils/sha256'
import { pdfSafeText } from '@/features/audit/utils/pdf-safe-text'
import type { EvidenceRecord } from '@/features/evidence/types/evidence'

function makeEvidence(partial: Partial<EvidenceRecord> & Pick<EvidenceRecord, 'id' | 'category'>): EvidenceRecord {
  return {
    fileName: partial.fileName ?? `${partial.id}.pdf`,
    fyEndYear: 2026,
    monthKey: null,
    documentDate: null,
    description: '',
    tags: [],
    linkedClaimId: null,
    linkedClaimLabel: null,
    destinationId: null,
    destinationName: null,
    title: partial.title ?? partial.id,
    mimeType: 'application/pdf',
    byteSize: 100,
    processingStatus: 'ready',
    storagePath: null,
    storageProvider: 'local_dev',
    storageBucket: 'local',
    driveFileId: null,
    driveParentFolderId: null,
    driveMirrorStatus: 'not_mirrored',
    softDeletedAt: null,
    createdAt: '2025-08-01T00:00:00.000Z',
    updatedAt: '2025-08-01T00:00:00.000Z',
    ...partial,
  }
}

describe('ATO Audit Package', () => {
  it('maps evidence into deterministic ZIP sections', () => {
    const planner = emptyPlanner(2026)
    const year = planner.years[0]!
    year.apartmentCosts = [
      {
        id: 'apt1',
        kind: 'rent',
        localAmount: 10000,
        exchangeRate: 100,
      },
    ]

    expect(auditSectionForEvidence(makeEvidence({ id: 'p1', category: 'payslip' }), year)).toBe(
      '02 Income',
    )
    expect(auditSectionForEvidence(makeEvidence({ id: 'r1', category: 'roster' }), year)).toBe(
      '04 Rosters',
    )
    expect(auditSectionForEvidence(makeEvidence({ id: 'i1', category: 'investment' }), year)).toBe(
      '06 Investments',
    )
    expect(auditSectionForEvidence(makeEvidence({ id: 'f1', category: 'flight' }), year)).toBe(
      '03 Travel',
    )
    expect(
      auditSectionForEvidence(
        makeEvidence({ id: 'a1', category: 'receipt', linkedClaimId: 'apt1' }),
        year,
      ),
    ).toBe('05 Apartment')
    expect(auditSectionForEvidence(makeEvidence({ id: 'o1', category: 'other' }), year)).toBe(
      '07 Other Deductions',
    )
  })

  it('organises Travel into Destinations and Transport subfolders', () => {
    const planner = emptyPlanner(2026)
    planner.destinations = [
      { id: 'd-syd', name: 'Sydney', sortOrder: 0 },
      { id: 'd-bne', name: 'Brisbane', sortOrder: 1 },
    ]
    const year = planner.years[0]!
    year.flights = [
      {
        id: 'flight1',
        currencyCode: 'AUD',
        localAmount: 200,
        exchangeRate: 1,
        workPercentage: 100,
      },
    ]
    year.transport = [
      {
        id: 'bus1',
        kind: 'bus',
        currencyCode: 'AUD',
        localAmount: 10,
        exchangeRate: 1,
        workPercentage: 100,
      },
      {
        id: 'taxi1',
        kind: 'taxi',
        currencyCode: 'AUD',
        localAmount: 40,
        exchangeRate: 1,
        workPercentage: 100,
      },
      {
        id: 'train1',
        kind: 'train',
        currencyCode: 'JPY',
        localAmount: 630,
        exchangeRate: 100,
        workPercentage: 100,
      },
    ]

    expect(
      auditZipFolderForEvidence(
        makeEvidence({ id: 'f1', category: 'flight', fileName: 'BNESYD.jpg' }),
        year,
        planner.destinations,
      ),
    ).toBe('03 Travel/Transport/Airfares')

    expect(
      auditZipFolderForEvidence(
        makeEvidence({
          id: 'f2',
          category: 'receipt',
          linkedClaimId: 'flight1',
          linkedClaimLabel: 'BNE-SYD',
        }),
        year,
        planner.destinations,
      ),
    ).toBe('03 Travel/Transport/Airfares')

    expect(
      auditZipFolderForEvidence(
        makeEvidence({
          id: 'b1',
          category: 'receipt',
          linkedClaimId: 'bus1',
          linkedClaimLabel: 'Airport bus',
        }),
        year,
        planner.destinations,
      ),
    ).toBe('03 Travel/Transport/Bus')

    expect(
      auditZipFolderForEvidence(
        makeEvidence({
          id: 't1',
          category: 'receipt',
          linkedClaimId: 'taxi1',
          linkedClaimLabel: 'Uber to hotel',
        }),
        year,
        planner.destinations,
      ),
    ).toBe('03 Travel/Transport/Taxi')

    expect(
      auditZipFolderForEvidence(
        makeEvidence({
          id: 'tr1',
          category: 'receipt',
          linkedClaimId: 'train1',
          linkedClaimLabel: 'HND - TYO',
        }),
        year,
        planner.destinations,
      ),
    ).toBe('03 Travel/Transport/Train')

    expect(
      auditZipFolderForEvidence(
        makeEvidence({
          id: 'syd1',
          category: 'travel',
          destinationId: 'd-syd',
          destinationName: 'Sydney',
        }),
        year,
        planner.destinations,
      ),
    ).toBe('03 Travel/Destinations/Sydney')

    expect(
      auditZipFolderForEvidence(
        makeEvidence({
          id: 'bne1',
          category: 'receipt',
          destinationName: 'Brisbane',
        }),
        year,
        planner.destinations,
      ),
    ).toBe('03 Travel/Destinations/Brisbane')

    expect(inferTransportFolderFromText('Uber to BNE airport')).toBe('Taxi')
    expect(
      travelSubfolderForSampleDay(
        { label: 'Sydney layover 07/07/26', createdAt: '2026-07-07T00:00:00.000Z' },
        'Australia',
      ),
    ).toBe('Destinations/Australia/Sydney layover 07-07-26')
  })

  it('nests sample-day linked evidence under Destinations/{city}/{sample day label}', () => {
    const planner = emptyPlanner(2026)
    planner.destinations = [{ id: 'd-au', name: 'Australia', sortOrder: 0 }]
    const year = planner.years[0]!
    const sampleDays: SampleDay[] = [
      {
        id: 'sd1',
        destinationId: 'd-au',
        fyEndYear: 2026,
        label: 'Sydney layover 07/07/26',
        status: 'complete',
        notes: '',
        receipts: [
          {
            id: 'r1',
            description: 'Dinner',
            category: 'meals',
            currencyCode: 'AUD',
            localAmount: 50,
            exchangeRate: 1,
            amountAud: 50,
            notes: '',
            imageDataUrl: null,
            imageFileName: null,
            evidenceId: 'ev-receipt-1',
          },
        ],
        linkedEvidenceIds: ['ev-linked-1'],
        completedAt: '2026-07-07T12:00:00.000Z',
        createdAt: '2026-07-07T00:00:00.000Z',
        updatedAt: '2026-07-07T12:00:00.000Z',
      },
    ]

    expect(
      auditZipFolderForEvidence(
        makeEvidence({
          id: 'ev-receipt-1',
          category: 'receipt',
          destinationId: 'd-au',
          destinationName: 'Australia',
          fileName: 'Screenshot_Drive.jpg',
        }),
        year,
        planner.destinations,
        sampleDays,
      ),
    ).toBe('03 Travel/Destinations/Australia/Sydney layover 07-07-26')

    expect(
      auditZipFolderForEvidence(
        makeEvidence({
          id: 'ev-linked-1',
          category: 'travel',
          destinationName: 'Australia',
        }),
        year,
        planner.destinations,
        sampleDays,
      ),
    ).toBe('03 Travel/Destinations/Australia/Sydney layover 07-07-26')

    expect(
      auditZipFolderForEvidence(
        makeEvidence({
          id: 'ev-other',
          category: 'travel',
          destinationName: 'Australia',
        }),
        year,
        planner.destinations,
        sampleDays,
      ),
    ).toBe('03 Travel/Destinations/Australia')
  })

  it('builds readiness with missing evidence and income gaps', () => {
    const planner = emptyPlanner(2026)
    planner.years[0]!.monthlyIncome = [
      {
        id: 'm1',
        monthKey: '2025-07',
        incomeUsd5th: 5000,
        incomeUsd20th: 5000,
        incomeUsd: 10000,
        usdAudRate: 0.65,
      },
    ]
    planner.years[0]!.otherClaims = [
      {
        id: 'c1',
        description: 'Headset',
        currencyCode: 'AUD',
        localAmount: 200,
        exchangeRate: 1,
        workPercentage: 100,
      },
    ]

    const readiness = buildAuditReadiness({
      fyEndYear: 2026,
      planner,
      evidence: [],
      sampleDays: [],
    })

    expect(readiness.overallPercent).toBeGreaterThanOrEqual(0)
    expect(readiness.overallPercent).toBeLessThanOrEqual(100)
    expect(readiness.missingEvidence.length).toBeGreaterThan(0)
    expect(readiness.incomeCompleteness.hasIncome).toBe(true)
    expect(readiness.incomeCompleteness.payslipDocuments).toBe(0)
    expect(readiness.outstandingTasks.some((t) => t.id === 'upload-payslips')).toBe(true)
  })

  it('builds package data with FX schedule and provenance without changing summary maths', () => {
    const planner = emptyPlanner(2026)
    planner.years[0]!.monthlyIncome = [
      {
        id: 'm1',
        monthKey: '2025-07',
        incomeUsd5th: 5000,
        incomeUsd20th: 5000,
        incomeUsd: 10000,
        usdAudRate: 0.65,
        usdAudFromAto: true,
      },
    ]
    planner.years[0]!.otherClaims = [
      {
        id: 'c1',
        description: 'Headset',
        currencyCode: 'USD',
        localAmount: 100,
        exchangeRate: 0.65,
        workPercentage: 100,
        rateFromAto: true,
      },
    ]

    const summary = summarizeFromPlanner(planner, 2026)!
    const data = buildAuditPackageData({
      taxpayer: { displayName: 'Alex', email: 'alex@example.com', userId: 'u1' },
      fyEndYear: 2026,
      fyLabel: '2025–26',
      planner,
      summary,
      evidence: [
        makeEvidence({
          id: 'e1',
          category: 'receipt',
          linkedClaimId: 'c1',
          linkedClaimLabel: 'Headset',
        }),
      ],
      sampleDays: [],
      options: { includeReceiptThumbnails: false },
    })

    expect(data.summary.totalIncomeAud).toBe(summary.totalIncomeAud)
    expect(data.summary.totalClaimsAud).toBe(summary.totalClaimsAud)
    expect(data.expenses.some((e) => e.label === 'Superannuation')).toBe(true)
    expect(data.currencyConversions.length).toBeGreaterThan(0)
    expect(data.traces.length).toBeGreaterThan(0)
    expect(data.evidenceRegister).toHaveLength(1)
    expect(data.overnightClaim).toBeDefined()
    expect(data.readiness.evidenceCounts.total).toBe(1)
  })

  it('generates a non-empty Audit Report PDF', async () => {
    const planner = emptyPlanner(2026)
    const summary = summarizeFromPlanner(planner, 2026)!
    const data = buildAuditPackageData({
      taxpayer: { displayName: 'Alex', email: 'a@b.c', userId: 'u1' },
      fyEndYear: 2026,
      fyLabel: '2025–26',
      planner,
      summary,
      evidence: [],
      sampleDays: [],
      options: { includeReceiptThumbnails: false },
    })
    const blob = await generateAuditReportPdf(data)
    expect(blob.size).toBeGreaterThan(800)
    expect(blob.type).toContain('pdf')
  })

  it('computes SHA-256 for manifest checksums', async () => {
    const hash = await sha256HexFromText('ajx-audit')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('sanitises Unicode that breaks Helvetica in PDFs', () => {
    expect(pdfSafeText('Σ (nights × rate) − total → claim')).toBe(
      'Sum (nights x rate) - total -> claim',
    )
    expect(pdfSafeText('grossRentAud − expensesAud')).toContain('grossRentAud - expensesAud')
  })
})
