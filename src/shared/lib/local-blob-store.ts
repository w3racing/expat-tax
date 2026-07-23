/**
 * IndexedDB binary store for MVP local evidence.
 * Keeps large data URLs out of localStorage (which hits ~5 MB on mobile Chrome).
 * Falls back to an in-memory map when IndexedDB is unavailable (e.g. unit tests).
 */

const DB_NAME = 'ajx-local-blobs'
const DB_VERSION = 1
const STORE = 'blobs'

type BlobRow = {
  id: string
  dataUrl: string
  updatedAt: string
}

const memoryFallback = new Map<string, string>()

function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB != null
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('Could not open local blob store'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
  })
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
  })
}

export async function putLocalBlob(id: string, dataUrl: string): Promise<void> {
  if (!hasIndexedDb()) {
    memoryFallback.set(id, dataUrl)
    return
  }
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const row: BlobRow = { id, dataUrl, updatedAt: new Date().toISOString() }
    await idbRequest(store.put(row))
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Could not save local blob'))
      tx.onabort = () => reject(tx.error ?? new Error('Local blob save aborted'))
    })
  } finally {
    db.close()
  }
}

export async function getLocalBlob(id: string): Promise<string | null> {
  if (!hasIndexedDb()) {
    return memoryFallback.get(id) ?? null
  }
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const row = await idbRequest(tx.objectStore(STORE).get(id))
    return (row as BlobRow | undefined)?.dataUrl ?? null
  } finally {
    db.close()
  }
}

export async function deleteLocalBlob(id: string): Promise<void> {
  if (!hasIndexedDb()) {
    memoryFallback.delete(id)
    return
  }
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await idbRequest(tx.objectStore(STORE).delete(id))
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('Could not delete local blob'))
      tx.onabort = () => reject(tx.error ?? new Error('Local blob delete aborted'))
    })
  } finally {
    db.close()
  }
}

export async function getLocalBlobs(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (ids.length === 0) return out
  if (!hasIndexedDb()) {
    for (const id of ids) {
      const dataUrl = memoryFallback.get(id)
      if (dataUrl) out.set(id, dataUrl)
    }
    return out
  }
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    await Promise.all(
      ids.map(async (id) => {
        const row = (await idbRequest(store.get(id))) as BlobRow | undefined
        if (row?.dataUrl) out.set(id, row.dataUrl)
      }),
    )
    return out
  } finally {
    db.close()
  }
}
