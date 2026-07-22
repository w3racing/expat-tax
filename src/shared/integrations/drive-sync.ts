/** Extension point for Google Drive sync (stub in MVP — ADR-022). */

export type DriveConnectionStatus = 'disconnected' | 'connected' | 'error'

export interface DriveSyncAdapter {
  readonly id: string
  getStatus(): Promise<DriveConnectionStatus>
  connect(): Promise<void>
  disconnect(): Promise<void>
}

export class DisconnectedDriveSync implements DriveSyncAdapter {
  readonly id = 'drive-disconnected'

  async getStatus(): Promise<DriveConnectionStatus> {
    return 'disconnected'
  }

  async connect(): Promise<void> {
    throw Object.assign(new Error('Google Drive sync is not enabled in MVP'), {
      code: 'PERMISSION',
    })
  }

  async disconnect(): Promise<void> {
    return
  }
}

let adapter: DriveSyncAdapter = new DisconnectedDriveSync()

export function getDriveSyncAdapter(): DriveSyncAdapter {
  return adapter
}

export function registerDriveSyncAdapter(next: DriveSyncAdapter) {
  adapter = next
}
