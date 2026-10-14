// Uploaded bike photos live in IndexedDB, not localStorage: a handful of phone photos would
// blow the ~5 MB localStorage quota that builds share. Builds reference them by key.

const DB_NAME = 'ppp-photos'
const STORE = 'photos'

let dbPromise: Promise<IDBDatabase> | undefined

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1)
    open.onupgradeneeded = () => open.result.createObjectStore(STORE)
    open.onsuccess = () => resolve(open.result)
    open.onerror = () => { dbPromise = undefined; reject(open.error) }
  })
  return dbPromise
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const store = (await db()).transaction(STORE, mode).objectStore(STORE)
  return new Promise((resolve, reject) => {
    const req = fn(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putPhoto(blob: Blob, key: string = crypto.randomUUID()): Promise<string> {
  await run('readwrite', (s) => s.put(blob, key))
  return key
}

export function getPhoto(key: string): Promise<Blob | undefined> {
  return run<Blob | undefined>('readonly', (s) => s.get(key) as IDBRequest<Blob | undefined>)
}

export async function allPhotoKeys(): Promise<string[]> {
  return (await run('readonly', (s) => s.getAllKeys())).map(String)
}

export async function deletePhotos(keys: string[]): Promise<void> {
  for (const key of keys) {
    await run('readwrite', (s) => s.delete(key))
    urlCache.delete(key)
  }
}

const urlCache = new Map<string, Promise<string | undefined>>()

/** An object URL for a stored photo (cached for the session), or undefined if it's gone. */
export function photoObjectUrl(key: string): Promise<string | undefined> {
  let url = urlCache.get(key)
  if (!url) {
    url = getPhoto(key).then((b) => (b ? URL.createObjectURL(b) : undefined)).catch(() => undefined)
    urlCache.set(key, url)
  }
  return url
}
