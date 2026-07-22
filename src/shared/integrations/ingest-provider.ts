/** Extension point for AI document ingest (stub in MVP — ADR-022). */

export type IngestResult = {
  status: 'skipped' | 'queued' | 'ready' | 'failed'
  confidence?: number
  rationale?: string
}

export interface IngestProviderAdapter {
  readonly id: string
  processDocument(input: {
    evidenceId: string
    mimeType?: string
    bytes?: ArrayBuffer
  }): Promise<IngestResult>
}

export class NoopIngestProvider implements IngestProviderAdapter {
  readonly id = 'noop-ingest'

  async processDocument(): Promise<IngestResult> {
    return { status: 'ready', rationale: 'Manual upload path — AI ingest not enabled in MVP.' }
  }
}

let provider: IngestProviderAdapter = new NoopIngestProvider()

export function getIngestProvider(): IngestProviderAdapter {
  return provider
}

export function registerIngestProvider(next: IngestProviderAdapter) {
  provider = next
}
