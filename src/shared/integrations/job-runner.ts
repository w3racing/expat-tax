/** Sync job runner for MVP; later swapped for Edge/Cron. */

export type JobPhase = {
  label: string
  progress: number
}

export type JobHandler<T> = (onPhase: (phase: JobPhase) => void) => Promise<T>

export async function runJob<T>(handler: JobHandler<T>, onPhase?: (phase: JobPhase) => void): Promise<T> {
  return handler((phase) => onPhase?.(phase))
}
