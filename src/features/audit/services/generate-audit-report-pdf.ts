import type { jsPDF } from 'jspdf'
import { sampleDayTotalAud } from '@/features/destination-workspace/types/sample-day'
import type { AuditPackageData, EvidenceRegisterRow } from '@/features/audit/types/audit-package'
import { pdfSafeText } from '@/features/audit/utils/pdf-safe-text'

/** A4 with print-safe margins (avoid home/office printer edge clipping). */
const PAGE = { w: 210, h: 297 }
const MARGIN = { left: 20, right: 20, top: 20, bottom: 28 }
const CONTENT_W = PAGE.w - MARGIN.left - MARGIN.right
const FOOTER_Y = PAGE.h - 12
const CONTENT_BOTTOM = PAGE.h - MARGIN.bottom

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

function nightsLabel(n: number): string {
  return `${n} night${n === 1 ? '' : 's'}`
}

type PdfCtx = {
  doc: jsPDF
  y: number
  page: number
}

type TocEntry = { title: string; page: number; id: string }

function T(text: string): string {
  return pdfSafeText(text)
}

function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y + needed <= CONTENT_BOTTOM) return
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
  doc.line(MARGIN.left, FOOTER_Y - 4, PAGE.w - MARGIN.right, FOOTER_Y - 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('AJX Tax · ATO Audit Package · Confidential', MARGIN.left, FOOTER_Y)
  doc.text(`Page ${page}`, PAGE.w - MARGIN.right, FOOTER_Y, { align: 'right' })
}

function drawContinuationHeader(ctx: PdfCtx) {
  const { doc } = ctx
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.text('AJX Tax - ATO Audit Report (continued)', MARGIN.left, ctx.y)
  ctx.y += 5
  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.setLineWidth(0.3)
  doc.line(MARGIN.left, ctx.y, PAGE.w - MARGIN.right, ctx.y)
  ctx.y += 8
}

function docSetInk(doc: jsPDF) {
  doc.setTextColor(INK.r, INK.g, INK.b)
}

/** Start each major section on a fresh page (professional working-paper layout). */
function beginSection(ctx: PdfCtx, title: string, toc: TocEntry[], id: string) {
  if (!(ctx.page === 1 && ctx.y <= MARGIN.top + 1)) {
    drawFooter(ctx)
    ctx.doc.addPage()
    ctx.page += 1
    ctx.y = MARGIN.top
  }
  toc.push({ title, page: ctx.page, id })
  try {
    ctx.doc.outline.add(null, T(title), { pageNumber: ctx.page })
  } catch {
    // Outline optional if runtime lacks support
  }
  docSetInk(ctx.doc)
  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(13)
  ctx.doc.text(T(title), MARGIN.left, ctx.y)
  ctx.y += 3
  ctx.doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b)
  ctx.doc.setLineWidth(0.7)
  ctx.doc.line(MARGIN.left, ctx.y, MARGIN.left + 42, ctx.y)
  ctx.y += 8
}

function kvRow(ctx: PdfCtx, label: string, value: string, opts?: { bold?: boolean }) {
  ensureSpace(ctx, 7)
  ctx.doc.setFont('helvetica', 'normal')
  ctx.doc.setFontSize(9)
  ctx.doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  ctx.doc.text(T(label), MARGIN.left, ctx.y)
  ctx.doc.setTextColor(INK.r, INK.g, INK.b)
  ctx.doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
  ctx.doc.text(T(value), PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
  ctx.y += 6
}

function amountTable(
  ctx: PdfCtx,
  rows: Array<{ label: string; amountAud: number }>,
  opts?: { emphasizeLast?: boolean; skipZeroExceptLast?: boolean },
) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    const isLast = Boolean(opts?.emphasizeLast && i === rows.length - 1)
    if (opts?.skipZeroExceptLast && !isLast && Math.abs(row.amountAud) < 0.005) continue
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
    ctx.doc.text(T(row.label), MARGIN.left + (isLast ? 2 : 0), ctx.y)
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
  const lines = ctx.doc.splitTextToSize(T(text), CONTENT_W) as string[]
  for (const line of lines) {
    ensureSpace(ctx, 5)
    ctx.doc.text(line, MARGIN.left, ctx.y)
    ctx.y += 4.5
  }
}

function subheading(ctx: PdfCtx, text: string) {
  ensureSpace(ctx, 10)
  ctx.y += 2
  ctx.doc.setFont('helvetica', 'bold')
  ctx.doc.setFontSize(10)
  docSetInk(ctx.doc)
  ctx.doc.text(T(text), MARGIN.left, ctx.y)
  ctx.y += 6
}

function imageFormat(dataUrl: string): 'JPEG' | 'PNG' | null {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG'
  if (dataUrl.startsWith('data:image/png')) return 'PNG'
  if (dataUrl.startsWith('data:image/webp')) return 'PNG'
  return null
}

function groupEvidenceByFolder(rows: EvidenceRegisterRow[]) {
  const map = new Map<string, EvidenceRegisterRow[]>()
  for (const row of rows) {
    const list = map.get(row.zipFolder) ?? []
    list.push(row)
    map.set(row.zipFolder, list)
  }
  return map
}

/**
 * Full ATO Audit Report PDF — cover, TOC (linked), summary, tax position,
 * travel, sample days, FX, evidence, provenance, thumbnails, declaration.
 */
export async function generateAuditReportPdf(data: AuditPackageData): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const ctx: PdfCtx = { doc, y: MARGIN.top, page: 1 }
  const toc: TocEntry[] = []

  // —— Cover ——
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.rect(0, 0, PAGE.w, 68, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('AJX Tax', MARGIN.left, 28)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.text('ATO Audit Package', MARGIN.left, 40)
  doc.setFontSize(11)
  doc.text(T(`Financial year ${data.fyLabel}`), MARGIN.left, 52)
  doc.text('Audit Report', PAGE.w - MARGIN.right, 28, { align: 'right' })

  ctx.y = 82
  docSetInk(doc)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(T(data.taxpayer.displayName || 'Taxpayer'), MARGIN.left, ctx.y)
  ctx.y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  if (data.taxpayer.email) {
    doc.text(T(data.taxpayer.email), MARGIN.left, ctx.y)
    ctx.y += 6
  }
  doc.text(T(`Prepared ${formatGeneratedAt(data.generatedAt)}`), MARGIN.left, ctx.y)
  ctx.y += 6
  doc.text(T(`Package ${data.packageVersion} · Ruleset ${data.rulesetVersion}`), MARGIN.left, ctx.y)
  ctx.y += 6
  doc.text(T(`Engine ${data.engineVersion}`), MARGIN.left, ctx.y)
  ctx.y += 6
  doc.text(T(`Package ID ${data.packageId.slice(0, 8).toUpperCase()}`), MARGIN.left, ctx.y)
  ctx.y += 12

  doc.setFillColor(SOFT.r, SOFT.g, SOFT.b)
  const disclaimerLines = doc.splitTextToSize(T(data.disclaimer), CONTENT_W - 4) as string[]
  const bandH = 8 + disclaimerLines.length * 4
  doc.rect(MARGIN.left, ctx.y - 4, CONTENT_W, bandH, 'F')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  let dy = ctx.y
  for (const line of disclaimerLines) {
    doc.text(line, MARGIN.left + 2, dy)
    dy += 4
  }
  ctx.y = dy + 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  docSetInk(doc)
  doc.text('Suitable for a registered tax agent or ATO information request.', MARGIN.left, ctx.y)
  ctx.y += 6
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('Indicative working papers - not a lodged return.', MARGIN.left, ctx.y)
  ctx.y += 10
  paragraph(
    ctx,
    'Companion ZIP includes sectioned evidence folders (01-07) and Manifest.json with SHA-256 checksums for each file.',
    8,
  )
  drawFooter(ctx)

  // —— TOC placeholder (filled after body so page numbers are final) ——
  doc.addPage()
  const tocPage = 2
  ctx.page = tocPage
  ctx.y = MARGIN.top
  drawFooter(ctx)

  // —— Executive summary ——
  beginSection(ctx, '1. Executive summary', toc, 'exec')
  const r = data.readiness
  kvRow(ctx, 'Audit readiness', `${r.overallPercent}%`, { bold: true })
  kvRow(ctx, 'Total income', money(data.summary.totalIncomeAud), { bold: true })
  kvRow(ctx, 'Total deductions / claims', money(data.summary.totalClaimsAud), { bold: true })
  kvRow(ctx, 'Overseas overnight claim', money(data.overnightClaim.totalClaimAud))
  kvRow(ctx, 'Estimated tax payable / (refund)', money(data.summary.estimatedTaxAud), {
    bold: true,
  })
  kvRow(ctx, 'Evidence documents', String(r.evidenceCounts.total))
  kvRow(
    ctx,
    'Claims with linked evidence',
    `${r.evidenceCounts.linkedClaims} / ${r.evidenceCounts.claimCount}`,
  )
  kvRow(
    ctx,
    'Sample days completed',
    `${r.sampleDayCompleteness.completed} / ${r.sampleDayCompleteness.total}`,
  )
  kvRow(ctx, 'Roster uploads', String(r.rosterUploads.count))
  ctx.y += 3

  if (r.missingEvidence.length > 0) {
    subheading(ctx, 'Missing evidence')
    for (const gap of r.missingEvidence) paragraph(ctx, `- ${gap}`, 8)
  } else {
    paragraph(ctx, 'No critical evidence gaps flagged for this year.', 9)
  }
  if (r.warnings.length > 0) {
    subheading(ctx, 'Warnings')
    for (const w of r.warnings) paragraph(ctx, `- ${w}`, 8)
  }

  // —— Tax Position ——
  beginSection(ctx, '2. Tax Position summary', toc, 'tax-position')
  subheading(ctx, 'Income')
  amountTable(ctx, data.income, { emphasizeLast: true, skipZeroExceptLast: true })
  subheading(ctx, 'Deductions / claims')
  amountTable(ctx, data.expenses, { emphasizeLast: true, skipZeroExceptLast: false })
  subheading(ctx, 'Tax calculation')
  amountTable(
    ctx,
    [
      { label: 'Taxable income', amountAud: data.summary.taxableIncomeAud },
      { label: 'Gross income tax (Stage 3)', amountAud: data.summary.grossIncomeTaxAud },
      { label: 'Less tax offsets', amountAud: -data.summary.taxOffsetsAud },
      { label: 'Income tax after offsets', amountAud: data.summary.incomeTaxAud },
      { label: 'Medicare levy', amountAud: data.summary.medicareLevyAud },
      { label: 'Estimated tax payable / (refund)', amountAud: data.summary.estimatedTaxAud },
    ],
    { emphasizeLast: true },
  )
  ctx.y += 2
  paragraph(
    ctx,
    `Effective rate ${((data.summary.effectiveRate || 0) * 100).toFixed(1)}%. Figures match Tax Position in the app; overnight counts remain the source of truth.`,
    8,
  )

  // —— Overseas travel ——
  beginSection(ctx, '3. Overseas travel summary by destination', toc, 'travel')
  const oc = data.overnightClaim
  kvRow(ctx, 'Qualifying overnights', String(oc.totalOvernights), { bold: true })
  kvRow(ctx, 'Overnight claim (AUD)', money(oc.totalClaimAud), { bold: true })
  paragraph(ctx, `Calculation: ${oc.formula}`, 8)
  paragraph(ctx, `Source: ${oc.source}`, 8)
  ctx.y += 2
  if (oc.destinations.length === 0) {
    paragraph(ctx, 'None for this financial year.')
  } else {
    for (const dest of oc.destinations) {
      ensureSpace(ctx, 14)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      docSetInk(doc)
      doc.text(T(dest.destinationName), MARGIN.left, ctx.y)
      doc.setFont('courier', 'normal')
      doc.text(money(dest.claimAud), PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
      ctx.y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
      const rateNote =
        dest.rateSource === 'sample_day_average' ? 'sample-day average' : 'planner daily rate'
      doc.text(
        T(`${nightsLabel(dest.qualifyingOvernights)} x ${money(dest.dailyRateAud)} (${rateNote})`),
        MARGIN.left,
        ctx.y,
      )
      ctx.y += 6
    }
  }

  // —— Sample days ——
  beginSection(ctx, '4. Sample day details', toc, 'sample-days')
  if (data.sampleDays.length === 0) {
    paragraph(ctx, 'None for this financial year.')
  } else {
    for (const day of data.sampleDays) {
      ensureSpace(ctx, 16)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      docSetInk(doc)
      const status = day.status === 'complete' ? 'Complete' : 'In progress'
      doc.text(T(`${day.label} · ${status}`), MARGIN.left, ctx.y)
      doc.setFont('courier', 'normal')
      doc.text(money(sampleDayTotalAud(day)), PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
      ctx.y += 5
      if (day.receipts.length === 0) {
        paragraph(ctx, 'No receipts on this sample day.', 8)
      } else {
        for (const rec of day.receipts) {
          ensureSpace(ctx, 6)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
          const bit = `${rec.category} · ${rec.description || 'Receipt'} · ${rec.currencyCode} ${rec.localAmount}`
          const lines = doc.splitTextToSize(T(bit), CONTENT_W - 36) as string[]
          doc.text(lines[0] ?? '', MARGIN.left, ctx.y)
          doc.setFont('courier', 'normal')
          doc.setTextColor(INK.r, INK.g, INK.b)
          doc.text(money(rec.amountAud), PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
          ctx.y += 4.5
        }
      }
      ctx.y += 3
    }
  }

  // —— FX schedule ——
  beginSection(ctx, '5. Currency conversion schedule', toc, 'fx')
  paragraph(
    ctx,
    'Rates use the AJX / ATO convention: foreign units per A$1. AUD = local amount / rate. Missing rates show as - and $0.00 until refreshed.',
    8,
  )
  ctx.y += 2
  if (data.currencyConversions.length === 0) {
    paragraph(ctx, 'No foreign-currency conversions recorded for this year.')
  } else {
    ensureSpace(ctx, 10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text('Source', MARGIN.left, ctx.y)
    doc.text('CCY', MARGIN.left + 58, ctx.y)
    doc.text('Local', MARGIN.left + 72, ctx.y)
    doc.text('Rate', MARGIN.left + 100, ctx.y)
    doc.text('AUD', PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
    ctx.y += 2
    doc.setDrawColor(RULE.r, RULE.g, RULE.b)
    doc.line(MARGIN.left, ctx.y, PAGE.w - MARGIN.right, ctx.y)
    ctx.y += 5
    for (const row of data.currencyConversions) {
      ensureSpace(ctx, row.rateFromAto ? 10 : 7)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      docSetInk(doc)
      const src = doc.splitTextToSize(T(`${row.source}: ${row.description}`), 56) as string[]
      doc.text(src[0] ?? '', MARGIN.left, ctx.y)
      doc.text(row.currencyCode, MARGIN.left + 58, ctx.y)
      doc.setFont('courier', 'normal')
      doc.text(row.localAmount.toFixed(2), MARGIN.left + 72, ctx.y)
      doc.text(row.exchangeRate > 0 ? row.exchangeRate.toFixed(4) : '-', MARGIN.left + 100, ctx.y)
      doc.text(money(row.amountAud), PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
      ctx.y += 4.5
      if (row.rateFromAto) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6)
        doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
        doc.text(
          row.exchangeRate > 0
            ? 'ATO monthly average applied'
            : 'Marked ATO-tracked but rate missing - refresh ATO rates in Settings',
          MARGIN.left,
          ctx.y,
        )
        ctx.y += 4
      }
    }
  }

  // —— Evidence register ——
  beginSection(ctx, '6. Evidence register', toc, 'evidence')
  kvRow(ctx, 'Documents', String(data.evidenceRegister.length))
  paragraph(
    ctx,
    'Grouped by ZIP folder (Travel uses Destinations/{city}/{sample day} and Transport/{Airfares|Bus|Train|Taxi}). Each file is also listed in Manifest.json with SHA-256 checksum.',
    8,
  )
  ctx.y += 2
  if (data.evidenceRegister.length === 0) {
    paragraph(ctx, 'None for this financial year.')
  } else {
    const grouped = groupEvidenceByFolder(data.evidenceRegister)
    for (const [folder, rows] of grouped) {
      subheading(ctx, folder)
      for (const row of rows) {
        ensureSpace(ctx, 14)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        docSetInk(doc)
        const nameLines = doc.splitTextToSize(T(row.fileName), CONTENT_W) as string[]
        doc.text(nameLines[0] ?? '', MARGIN.left, ctx.y)
        ctx.y += 4
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
        const meta = [
          row.category,
          row.linkedClaim ? `Linked: ${row.linkedClaim}` : 'Unlinked',
          row.documentDate ? `Doc ${row.documentDate}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
        const metaLines = doc.splitTextToSize(T(meta), CONTENT_W) as string[]
        doc.text(metaLines[0] ?? '', MARGIN.left, ctx.y)
        ctx.y += 3.5
        doc.text(T(`Uploaded ${formatGeneratedAt(row.uploadDate)} · ID ${row.id.slice(0, 8)}`), MARGIN.left, ctx.y)
        ctx.y += 5
      }
    }
  }

  // —— Provenance ——
  beginSection(ctx, '7. Calculation provenance', toc, 'provenance')
  paragraph(
    ctx,
    'Each figure traces to Tax Position inputs. Overnight counts remain the source of truth; rosters are evidence only.',
    8,
  )
  ctx.y += 2
  for (const trace of data.traces) {
    // Keep material lines + always keep totals / tax lines
    const keep =
      Math.abs(trace.resultAud) >= 0.005 ||
      [
        'total-income',
        'total-claims',
        'taxable-income',
        'gross-income-tax',
        'estimated-tax',
        'overseas-daily',
        'employment-income',
      ].includes(trace.id)
    if (!keep) continue

    ensureSpace(ctx, 16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    docSetInk(doc)
    doc.text(T(trace.label), MARGIN.left, ctx.y)
    doc.setFont('courier', 'normal')
    doc.text(money(trace.resultAud), PAGE.w - MARGIN.right, ctx.y, { align: 'right' })
    ctx.y += 5
    paragraph(ctx, `Source: ${trace.source}`, 7)
    paragraph(ctx, `Calculation: ${trace.calculation}`, 7)
    ctx.y += 2
  }

  // —— Thumbnails appendix ——
  if (data.options.includeReceiptThumbnails && data.thumbnails.length > 0) {
    beginSection(ctx, '8. Receipt thumbnails (appendix)', toc, 'thumbnails')
    paragraph(
      ctx,
      'Visual reference only. Original files are in the Audit Evidence ZIP under the folders named in the evidence register.',
      8,
    )
    ctx.y += 4

    const thumbW = 36
    const thumbH = 36
    const gapX = 6
    const gapY = 10
    const labelH = 10
    const colW = thumbW + gapX
    const cols = Math.max(1, Math.floor((CONTENT_W + gapX) / colW))
    let col = 0

    for (const thumb of data.thumbnails) {
      const fmt = imageFormat(thumb.dataUrl)
      if (!fmt) continue

      if (col === 0) ensureSpace(ctx, thumbH + labelH + gapY)
      const x = MARGIN.left + col * colW
      const y = ctx.y

      try {
        doc.setDrawColor(RULE.r, RULE.g, RULE.b)
        doc.setLineWidth(0.2)
        doc.rect(x, y, thumbW, thumbH)
        doc.addImage(thumb.dataUrl, fmt, x + 1, y + 1, thumbW - 2, thumbH - 2)
      } catch {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
        doc.text('Image unavailable', x + 2, y + thumbH / 2)
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
      const label = doc.splitTextToSize(T(thumb.label), thumbW) as string[]
      doc.text(label[0] ?? '', x, y + thumbH + 3)
      const src =
        thumb.source === 'sample_receipt' ? 'Sample day' : 'Evidence Vault'
      doc.text(src, x, y + thumbH + 7)

      col += 1
      if (col >= cols) {
        col = 0
        ctx.y += thumbH + labelH + gapY
      }
    }
    if (col !== 0) ctx.y += thumbH + labelH + gapY
  }

  // —— Declaration ——
  const declNumber = data.options.includeReceiptThumbnails && data.thumbnails.length > 0 ? '9' : '8'
  beginSection(ctx, `${declNumber}. Declaration`, toc, 'declaration')
  paragraph(
    ctx,
    'I declare that, to the best of my knowledge, the overnight counts, sample days, claims, and supporting documents in this package are complete and accurate for the stated financial year. I understand that AJX Tax organises evidence and maintains indicative working papers; it does not provide tax advice or lodge a return with the Australian Taxation Office.',
    9,
  )
  ctx.y += 8
  kvRow(ctx, 'Taxpayer name', data.taxpayer.displayName || '-')
  kvRow(ctx, 'Financial year', data.fyLabel)
  kvRow(ctx, 'Package generated', formatGeneratedAt(data.generatedAt))
  kvRow(ctx, 'Package ID', data.packageId.slice(0, 8).toUpperCase())
  ctx.y += 14
  ensureSpace(ctx, 28)
  doc.setDrawColor(RULE.r, RULE.g, RULE.b)
  doc.setLineWidth(0.4)
  doc.line(MARGIN.left, ctx.y, MARGIN.left + 90, ctx.y)
  ctx.y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('Signature (optional)', MARGIN.left, ctx.y)
  ctx.y += 14
  doc.line(MARGIN.left, ctx.y, MARGIN.left + 50, ctx.y)
  ctx.y += 5
  doc.text('Date', MARGIN.left, ctx.y)
  drawFooter(ctx)

  // —— Fill TOC with linked entries ——
  doc.setPage(tocPage)
  let ty = MARGIN.top
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  docSetInk(doc)
  doc.text('Table of contents', MARGIN.left, ty)
  ty += 3
  doc.setDrawColor(ACCENT.r, ACCENT.g, ACCENT.b)
  doc.setLineWidth(0.7)
  doc.line(MARGIN.left, ty, MARGIN.left + 42, ty)
  ty += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  doc.text('Cover', MARGIN.left, ty)
  doc.text('1', PAGE.w - MARGIN.right, ty, { align: 'right' })
  try {
    doc.link(MARGIN.left, ty - 3.5, CONTENT_W, 5, { pageNumber: 1 })
  } catch {
    /* optional */
  }
  ty += 7

  for (const entry of toc) {
    docSetInk(doc)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const title = T(entry.title)
    doc.text(title, MARGIN.left, ty)
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
    doc.text(String(entry.page), PAGE.w - MARGIN.right, ty, { align: 'right' })
    // Leader dots
    const titleW = doc.getTextWidth(title)
    const pageW = doc.getTextWidth(String(entry.page))
    const dotsStart = MARGIN.left + titleW + 2
    const dotsEnd = PAGE.w - MARGIN.right - pageW - 2
    if (dotsEnd > dotsStart + 4) {
      doc.setFontSize(8)
      let dx = dotsStart
      while (dx < dotsEnd) {
        doc.text('.', dx, ty)
        dx += 2.2
      }
    }
    try {
      doc.link(MARGIN.left, ty - 3.5, CONTENT_W, 5, { pageNumber: entry.page })
    } catch {
      /* optional */
    }
    ty += 7.5
  }

  ty += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b)
  const note = doc.splitTextToSize(
    T(
      'Click a section title to jump (in supporting PDF viewers). Page numbers refer to this Audit Report. Evidence binaries live in the companion ZIP.',
    ),
    CONTENT_W,
  ) as string[]
  for (const line of note) {
    doc.text(line, MARGIN.left, ty)
    ty += 4
  }
  drawFooter({ doc, y: ty, page: tocPage })

  return doc.output('blob')
}

export function auditReportPdfFileName(fyEndYear: number): string {
  return `AJX-Tax-FY${fyEndYear}-Audit-Report.pdf`
}
