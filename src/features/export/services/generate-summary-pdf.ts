import type { jsPDF } from 'jspdf'
import type { AccountantPackageData } from '@/features/export/types/accountant-package'

const PAGE = { w: 210, h: 297 }
const MARGIN = { left: 18, right: 18, top: 18, bottom: 22 }
const CONTENT_W = PAGE.w - MARGIN.left - MARGIN.right

const INK = { r: 15, g: 27, b: 45 }
const MUTED = { r: 100, g: 112, b: 128 }
const RULE = { r: 210, g: 216, b: 224 }
const ACCENT = { r: 28, g: 58, b: 92 }
const SOFT = { r: 245, g: 247, b: 250 }

function money(n: number): string {
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return n < 0 ? `($${formatted})` : `$${formatted}`
}

function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type PdfCtx = {
  doc: jsPDF
  y: number
  page: number
}

function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y + needed <= PAGE.h - MARGIN.bottom) return
  drawFooter(ctx)
  ctx.doc.addPage()
  ctx.page += 1
  ctx.y = MARGIN.top
  drawContinuationHeader(ctx)
}

function drawFooter(ctx: PdfCtx) {
  const { doc, page } = ctx
  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.setLineWidth(0.3)
  doc.line(MARGIN.left, PAGE.h - 14, PAGE.w - MARGIN.right, PAGE.h - 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('AJX Tax · Accountant working papers · Confidential', MARGIN.left, PAGE.h - 9)
  doc.text(`Page ${page}`, PAGE.w - MARGIN.right, PAGE.h - 9, { align: 'right' })
}

function drawContinuationHeader(ctx: PdfCtx) {
  const { doc } = ctx
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.text('AJX Tax — Accountant summary (continued)', MARGIN.left, ctx.y)
  ctx.y += 6
  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.line(MARGIN.left, ctx.y, PAGE.w - MARGIN.right, ctx.y)
  ctx.y += 8
}

function sectionTitle(ctx: PdfCtx, title: string) {
  ensureSpace(ctx, 16)
  ctx.y += 2
  docSetInk(ctx.doc)
  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(12)
  ctx.doc.text(title, MARGIN.left, ctx.y)
  ctx.y += 3
  ctx.doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b)
  ctx.doc.setLineWidth(0.6)
  ctx.doc.line(MARGIN.left, ctx.y, MARGIN.left + 36, ctx.y)
  ctx.y += 7
}

function docSetInk(doc: jsPDF) {
  doc.setTextColor(INK.r, INK.g, INK.b)
}

function kvRow(ctx: PdfCtx, label: string, value: string, opts?: { bold?: boolean }) {
  ensureSpace(ctx, 7)
  ctx.doc.setFont('helvetica', 'normal')
  ctx.doc.setFontSize(9)
  ctx.doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  ctx.doc.text(label, MARGIN.left, ctx.y)
  ctx.doc.setTextColor(INK.r, INK.g, INK.b)
  ctx.doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
  ctx.doc.text(value, PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
  ctx.y += 6
}

function amountTable(
  ctx: PdfCtx,
  rows: Array<{ label: string; amountAud: number }>,
  opts?: { emphasizeLast?: boolean },
) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    const isLast = opts?.emphasizeLast && i === rows.length - 1
    ensureSpace(ctx, isLast ? 10 : 7)
    if (isLast) {
      ctx.doc.setFillColor(SOFT.r, SOFT.g, SOFT.b)
      ctx.doc.rect(MARGIN.left, ctx.y - 4, CONTENT_W, 8, 'F')
      ctx.doc.setFont('helvetica', 'bold')
    } else {
      ctx.doc.setFont('helvetica', 'normal')
    }
    ctx.doc.setFontSize(9)
    docSetInk(ctx.doc)
    ctx.doc.text(row.label, MARGIN.left + (isLast ? 2 : 0), ctx.y)
    ctx.doc.setFont('courier', isLast ? 'bold' : 'normal')
    ctx.doc.text(money(row.amountAud), PAGE.w - MARGIN.right - (isLast ? 2 : 0), ctx.y, {
      align: 'right',
    })
    ctx.y += isLast ? 8 : 6
  }
}

function paragraph(ctx: PdfCtx, text: string, size = 9) {
  ctx.doc.setFont('helvetica', 'normal')
  ctx.doc.setFontSize(size)
  ctx.doc.setTextColor(INK.r, INK.g, INK.b)
  const lines = ctx.doc.splitTextToSize(text, CONTENT_W) as string[]
  for (const line of lines) {
    ensureSpace(ctx, 5)
    ctx.doc.text(line, MARGIN.left, ctx.y)
    ctx.y += 4.5
  }
}

/**
 * Professional A4 accountant summary PDF (MVP).
 * Future: audit packages, portal, evidence bundles.
 */
export async function generateAccountantSummaryPdf(
  data: AccountantPackageData,
): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const ctx: PdfCtx = { doc, y: MARGIN.top, page: 1 }

  // —— Cover header ——
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.rect(0, 0, PAGE.w, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('AJX Tax', MARGIN.left, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Accountant working papers', MARGIN.left, 21)
  doc.setFontSize(9)
  doc.text(`Financial year ${data.fyLabel}`, PAGE.w - MARGIN.right, 14, { align: 'right' })
  doc.text('Indicative · Not for lodgement', PAGE.w - MARGIN.right, 21, { align: 'right' })

  ctx.y = 42

  // Disclaimer band
  doc.setFillColor(SOFT.r, SOFT.g, SOFT.b)
  const disclaimerLines = doc.splitTextToSize(data.disclaimer, CONTENT_W - 4) as string[]
  const bandH = 6 + disclaimerLines.length * 4
  doc.rect(MARGIN.left, ctx.y - 4, CONTENT_W, bandH, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  let dy = ctx.y
  for (const line of disclaimerLines) {
    doc.text(line, MARGIN.left + 2, dy)
    dy += 4
  }
  ctx.y = dy + 6

  // —— Taxpayer details ——
  sectionTitle(ctx, '1. Taxpayer details')
  kvRow(ctx, 'Name', data.taxpayer.displayName || '—')
  kvRow(ctx, 'Email', data.taxpayer.email || '—')
  kvRow(ctx, 'Client reference', data.taxpayer.userId.slice(0, 8).toUpperCase())
  kvRow(ctx, 'Prepared', formatGeneratedAt(data.generatedAt))
  kvRow(ctx, 'Calculation engine', data.engineVersion)
  kvRow(ctx, 'Export version', data.exportVersion)

  // —— Financial year ——
  sectionTitle(ctx, '2. Financial year')
  kvRow(ctx, 'Australian financial year', data.fyLabel, { bold: true })
  kvRow(ctx, 'Year ending 30 June', String(data.fyEndYear))

  // —— Income ——
  sectionTitle(ctx, '3. Income summary')
  amountTable(ctx, data.income, { emphasizeLast: true })

  // —— Expenses ——
  sectionTitle(ctx, '4. Expense summary')
  amountTable(ctx, data.expenses, { emphasizeLast: true })

  // —— Overnight claim provenance ——
  sectionTitle(ctx, '5. Overseas overnight claim')
  const oc = data.overnightClaim
  kvRow(ctx, 'Qualifying overnights', String(oc.totalOvernights), { bold: true })
  kvRow(ctx, 'Completed sample days', String(oc.completedSampleDayCount))
  kvRow(ctx, 'Overnight claim (AUD)', money(oc.totalClaimAud), { bold: true })
  ctx.y += 2
  paragraph(ctx, `Source: ${oc.source}`, 8)
  paragraph(ctx, `Calculation: ${oc.formula}`, 8)
  if (oc.destinations.length === 0) {
    paragraph(ctx, 'No destination overnight rows for this year.', 9)
  } else {
    ctx.y += 2
    for (const dest of oc.destinations) {
      ensureSpace(ctx, 14)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      docSetInk(doc)
      doc.text(dest.destinationName, MARGIN.left, ctx.y)
      doc.setFont('courier', 'normal')
      doc.text(money(dest.claimAud), PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
      ctx.y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
      const rateNote =
        dest.rateSource === 'sample_day_average'
          ? 'sample-day average'
          : 'planner daily rate'
      doc.text(
        `${dest.qualifyingOvernights} nights × ${money(dest.dailyRateAud)} (${rateNote})`,
        MARGIN.left,
        ctx.y,
      )
      ctx.y += 4
      if (dest.completedDayLabels.length > 0) {
        const labels = dest.completedDayLabels.join('; ')
        const lines = doc.splitTextToSize(`Sample days: ${labels}`, CONTENT_W) as string[]
        for (const line of lines) {
          ensureSpace(ctx, 4)
          doc.text(line, MARGIN.left, ctx.y)
          ctx.y += 3.5
        }
      }
      ctx.y += 2
    }
  }

  // —— Claims ——
  sectionTitle(ctx, '6. Other claims')
  if (data.claims.length === 0) {
    paragraph(ctx, 'No individual claim lines recorded for this year.')
  } else {
    ensureSpace(ctx, 10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text('Date', MARGIN.left, ctx.y)
    doc.text('Category', MARGIN.left + 22, ctx.y)
    doc.text('Description', MARGIN.left + 48, ctx.y)
    doc.text('AUD', PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
    ctx.y += 2
    doc.setDrawColor(RULE.r, RULE.g, RULE.b)
    doc.setLineWidth(0.2)
    doc.line(MARGIN.left, ctx.y, PAGE.w - MARGIN.right, ctx.y)
    ctx.y += 5

    for (const claim of data.claims) {
      ensureSpace(ctx, 8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      docSetInk(doc)
      const dateBit = claim.dateYmd
        ? claim.dateYmd.replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$3/$2/$1')
        : '—'
      doc.text(dateBit, MARGIN.left, ctx.y)
      doc.text(claim.category, MARGIN.left + 22, ctx.y)
      const desc = doc.splitTextToSize(claim.description, 110) as string[]
      doc.text(desc[0] ?? '', MARGIN.left + 48, ctx.y)
      doc.setFont('courier', 'normal')
      doc.text(money(claim.amountAud), PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
      ctx.y += 5
      if (claim.currencyNote) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
        doc.text(claim.currencyNote, MARGIN.left + 48, ctx.y)
        ctx.y += 4
      }
    }
  }

  // —— Tax calculation ——
  sectionTitle(ctx, '7. Tax calculation summary')
  const s = data.summary
  amountTable(ctx, [
    { label: 'Total income', amountAud: s.totalIncomeAud },
    { label: 'Total deductions / claims', amountAud: s.totalClaimsAud },
    { label: 'Taxable income', amountAud: s.taxableIncomeAud },
    { label: 'Gross income tax (Stage 3)', amountAud: s.grossIncomeTaxAud },
    { label: 'Less tax offsets (franking, TFN, foreign)', amountAud: -s.taxOffsetsAud },
    { label: 'Income tax after offsets', amountAud: s.incomeTaxAud },
    { label: 'Medicare levy', amountAud: s.medicareLevyAud },
    { label: 'Estimated tax payable / (refund)', amountAud: s.estimatedTaxAud },
  ], { emphasizeLast: true })

  ensureSpace(ctx, 12)
  ctx.doc.setFont('helvetica', 'normal')
  ctx.doc.setFontSize(8)
  ctx.doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  ctx.doc.text(
    `Effective rate ${((s.effectiveRate || 0) * 100).toFixed(1)}% · Superannuation reported ${money(s.superannuationAud)}`,
    MARGIN.left,
    ctx.y,
  )
  ctx.y += 8

  if (s.bracketRows.length > 0) {
    ensureSpace(ctx, 10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    docSetInk(doc)
    doc.text('Income tax brackets (applied)', MARGIN.left, ctx.y)
    ctx.y += 5
    for (const row of s.bracketRows) {
      if (row.taxAud <= 0 && row.from > s.taxableIncomeAud) continue
      ensureSpace(ctx, 6)
      const toLabel = row.to == null ? 'and over' : money(row.to)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
      doc.text(
        `${money(row.from)} – ${toLabel} @ ${(row.rate * 100).toFixed(0)}%`,
        MARGIN.left,
        ctx.y,
      )
      doc.setFont('courier', 'normal')
      doc.setTextColor(INK.r, INK.g, INK.b)
      doc.text(money(row.taxAud), PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
      ctx.y += 5
    }
  }

  // —— Evidence completeness ——
  sectionTitle(ctx, '8. Supporting documents')
  kvRow(ctx, 'Documents in vault', String(data.evidence.documentCount))
  kvRow(
    ctx,
    'Claims with receipt attached',
    `${data.evidence.linkedCount} / ${data.evidence.claimCount}`,
  )
  kvRow(ctx, 'Package readiness', `${data.evidence.completenessPercent}%`, { bold: true })
  ctx.y += 1
  paragraph(
    ctx,
    'Not every claim needs a receipt on file. Small or frequent expenses are often substantiated from bank or credit card statements if the ATO asks.',
    7,
  )

  if (data.evidence.byCategory.length > 0) {
    ctx.y += 2
    paragraph(ctx, 'Documents by category:', 8)
    for (const row of data.evidence.byCategory) {
      kvRow(ctx, row.category, String(row.count))
    }
  }

  if (data.evidence.gaps.length > 0) {
    ctx.y += 2
    ensureSpace(ctx, 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    docSetInk(doc)
    doc.text('Notes for agent review', MARGIN.left, ctx.y)
    ctx.y += 5
    for (const gap of data.evidence.gaps) {
      ensureSpace(ctx, 6)
      paragraph(ctx, `• ${gap}`, 8)
    }
  } else {
    ctx.y += 2
    paragraph(ctx, 'No additional notes flagged for this year.', 9)
  }

  // —— Notes ——
  sectionTitle(ctx, '9. Notes')
  if (data.notes.trim()) {
    paragraph(ctx, data.notes, 9)
  } else {
    paragraph(ctx, 'No year notes recorded in Tax Position.', 9)
  }

  ctx.y += 8
  ensureSpace(ctx, 20)
  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.line(MARGIN.left, ctx.y, PAGE.w - MARGIN.right, ctx.y)
  ctx.y += 6
  paragraph(
    ctx,
    'This package includes overnight claim provenance (nights × daily amount, sample-day averages). Restore full app data via Settings → Backup & restore using ajx-tax-backup JSON.',
    8,
  )

  drawFooter(ctx)

  return doc.output('blob')
}

export function accountantPdfFileName(fyEndYear: number): string {
  return `AJX-Tax-FY${fyEndYear}-Accountant-Summary.pdf`
}
