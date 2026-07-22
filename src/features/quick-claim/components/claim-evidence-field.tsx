import { useRef } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { UploadStatus, type UploadPhase } from '@/shared/components/ui/upload-status'

type ClaimEvidenceFieldProps = {
  file: File | null
  phase: UploadPhase
  errorMessage?: string | null
  onFileChange: (file: File | null) => void
  onRetry?: () => void
}

export function ClaimEvidenceField({
  file,
  phase,
  errorMessage,
  onFileChange,
  onRetry,
}: ClaimEvidenceFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <Label htmlFor="claim-evidence">Evidence</Label>
      <input
        ref={fileRef}
        accept="image/*,.pdf,application/pdf"
        className="sr-only"
        id="claim-evidence"
        type="file"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null
          onFileChange(next)
        }}
      />
      {!file ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            Attach receipt
          </Button>
          <p className="text-xs text-muted-foreground sm:self-center">
            Photo or PDF from your library
          </p>
        </div>
      ) : (
        <>
          <UploadStatus
            errorMessage={errorMessage ?? undefined}
            fileName={file.name}
            phase={phase === 'idle' ? 'ready' : phase}
            onRetry={phase === 'failed' ? onRetry : undefined}
          />
          {phase === 'idle' || phase === 'ready' || phase === 'failed' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => {
                  onFileChange(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
              >
                Remove
              </Button>
              {phase === 'failed' ? (
                <Button size="sm" type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  Choose another file
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
