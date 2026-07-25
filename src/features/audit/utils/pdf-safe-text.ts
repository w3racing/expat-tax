/**
 * jsPDF Helvetica uses WinAnsi — exotic Unicode (Σ, −, →, curly quotes)
 * renders as broken spaced glyphs. Normalise for printable audit PDFs.
 */
export function pdfSafeText(input: string): string {
  return input
    .replaceAll('Σ', 'Sum')
    .replaceAll('×', 'x')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('–', '-')
    .replaceAll('—', '-')
    .replaceAll('→', '->')
    .replaceAll('←', '<-')
    .replaceAll('≤', '<=')
    .replaceAll('≥', '>=')
    .replaceAll('∞', 'inf')
    .replaceAll('·', ' | ')
    .replaceAll('•', '-')
    .replaceAll('’', "'")
    .replaceAll('‘', "'")
    .replaceAll('“', '"')
    .replaceAll('”', '"')
    .replaceAll('…', '...')
    .replaceAll('£', '')
    .normalize('NFKD')
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, '')
}
