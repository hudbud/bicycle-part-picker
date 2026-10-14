// Keeps a signed-in person's stores in their account. Everything still lives in localStorage
// first; this copies each store up a moment after it changes, and merges in changes from
// other devices when the app opens or comes back into view. See merge.ts for the rules.

import type { Build } from '@/types/build'
import type { Part } from '@/types/parts'
import { useBuildStore } from '@/store/buildStore'
import { useGarageStore } from '@/store/garageStore'
import { usePartsBinStore, type BinItem } from '@/store/partsBinStore'
import { useCustomPartsStore } from '@/store/customPartsStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useToastStore } from '@/store/toastStore'
import { collectPhotoGarbage } from '@/utils/bikePhotos'
import { hostLocalPhotos } from './photoHosting'
import { useAccountStore } from './accountStore'
import { mergeById, mergeFields, mergeWhole, newerUpdate } from './merge'
import { MAX_BLOB_BYTES, SYNC_KEYS, type AccountUser, type SyncKey } from './syncKeys'

const META_KEY = 'ppp-account-sync'
const SAVE_DELAY_MS = 1200
const PULL_EVERY_MS = 20_000

const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => useToastStore.getState().show(message, type)
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

// ---------- stores ----------

interface Adapter<T> {
  get: () => T
  set: (v: T) => void
  /** Fires when this store's synced data changes. */
  subscribe: (onChange: () => void) => void
  merge: (base: T | undefined, local: T, remote: T) => T
  /** Value for a browser that's switching to an account with nothing saved for this store. */
  empty: () => T
}

const watch = <S, T>(store: { subscribe: (fn: (s: S, p: S) => void) => unknown }, pick: (s: S) => T) =>
  (onChange: () => void) => { store.subscribe((s, p) => { if (pick(s) !== pick(p)) onChange() }) }

const hasContent = (b: Build) => b.components.some((c) => c.part) || !!b.additionalItems?.length

const buildAdapter: Adapter<Build> = {
  get: () => useBuildStore.getState().build,
  set: (v) => useBuildStore.getState().loadBuild(v),
  subscribe: watch(useBuildStore, (s) => s.build),
  merge: (base, local, remote) => {
    const { value, conflict } = mergeWhole(base, local, remote, (b) => !hasContent(b))
    if (conflict) {
      // Both devices changed the bench build since they last synced. Keep this one open and
      // park the other in the garage rather than drop it.
      const name = `${conflict.name} (from another device)`
      useGarageStore.getState().importBuilds([{ ...conflict, id: undefined, name }])
      toast(`Your other device had a different build open. It's in your garage as “${name}”.`)
    }
    return value
  },
  empty: () => ({ ...useBuildStore.getInitialState().build }),
}

const garageAdapter: Adapter<Build[]> = {
  get: () => useGarageStore.getState().builds,
  set: (builds) => useGarageStore.setState({ builds }),
  subscribe: watch(useGarageStore, (s) => s.builds),
  merge: (base, local, remote) => mergeById(base, local, remote, newerUpdate),
  empty: () => [],
}

const partsBinAdapter: Adapter<BinItem[]> = {
  get: () => usePartsBinStore.getState().items,
  set: (items) => usePartsBinStore.setState({ items }),
  subscribe: watch(usePartsBinStore, (s) => s.items),
  merge: (base, local, remote) => mergeById(base, local, remote),
  empty: () => [],
}

const customPartsAdapter: Adapter<Part[]> = {
  get: () => useCustomPartsStore.getState().parts,
  set: (parts) => useCustomPartsStore.setState({ parts }),
  subscribe: watch(useCustomPartsStore, (s) => s.parts),
  merge: (base, local, remote) => mergeById(base, local, remote),
  empty: () => [],
}

type SyncedSettings = { builderName: string; distanceUnit: 'mi' | 'km'; colorScheme: string; titleGradients: boolean }
const pickSettings = (): SyncedSettings => {
  const { builderName, distanceUnit, colorScheme, titleGradients } = useSettingsStore.getState()
  return { builderName, distanceUnit, colorScheme, titleGradients }
}

const settingsAdapter: Adapter<SyncedSettings> = {
  get: pickSettings,
  set: (v) => useSettingsStore.setState(v),
  subscribe: (onChange) => {
    useSettingsStore.subscribe((s, p) => {
      if (s.builderName !== p.builderName || s.distanceUnit !== p.distanceUnit || s.colorScheme !== p.colorScheme || s.titleGradients !== p.titleGradients) onChange()
    })
  },
  merge: mergeFields,
  // Appearance belongs to the device as much as the person; keep it when switching accounts.
  empty: () => ({ ...pickSettings(), builderName: '' }),
}

const ADAPTERS: Record<SyncKey, Adapter<any>> = {
  build: buildAdapter,
  garage: garageAdapter,
  partsBin: partsBinAdapter,
  customParts: customPartsAdapter,
  settings: settingsAdapter,
}

// ---------- what this browser last synced ----------

interface Synced { version: number; data: unknown }
/** Whose data this browser holds, and each store as of its last save/pull (the merge base). */
interface Meta { userId?: string; base: Partial<Record<SyncKey, Synced>> }

// Read fresh every time: other tabs share it.
function readMeta(): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(META_KEY) ?? '')
    return m && typeof m === 'object' ? { base: {}, ...m } : { base: {} }
  } catch {
    return { base: {} }
  }
}

function writeMeta(meta: Meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    // Storage full: the next sync merges against an older base, which only costs an extra merge.
  }
}

function setBase(key: SyncKey, synced: Synced | undefined) {
  const meta = readMeta()
  if (synced) meta.base[key] = synced
  else delete meta.base[key]
  writeMeta(meta)
}

// ---------- API ----------

class HttpError extends Error {
  constructor(public status: number, public body: any) { super(`HTTP ${status}`) }
}

async function api<T = any>(method: string, path: string, body?: string, headers: Record<string, string> = {}, keepalive = false): Promise<T> {
  const res = await fetch(path, {
    method,
    body,
    keepalive,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : undefined
  if (!res.ok || !isJson) throw new HttpError(res.status, data)
  return data as T
}

// ---------- sync ----------

const dirty = new Set<SyncKey>()
let saveTimer: ReturnType<typeof setTimeout> | undefined
let retryMs = 5000
let flushing: Promise<void> | undefined
let lastPull = 0

const setStatus = (status: ReturnType<typeof useAccountStore.getState>['status'], statusDetail?: string) =>
  useAccountStore.setState({ status, statusDetail })

const signedIn = () => !!useAccountStore.getState().user

function markDirty(key: SyncKey) {
  if (!signedIn()) return
  dirty.add(key)
  setStatus('saving')
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void flush(), SAVE_DELAY_MS)
}

/** Merges the account's copy of one store into this browser. */
function applyRemote(key: SyncKey, remote: Synced | undefined, replace: boolean) {
  const a = ADAPTERS[key]
  const base = readMeta().base[key]
  const local = a.get()
  const next = replace
    ? (remote ? remote.data : a.empty())
    : (remote ? a.merge(base?.data, local, remote.data) : local)
  if (!same(next, local)) a.set(next)
  setBase(key, remote)
  if (!same(a.get(), remote?.data)) dirty.add(key)
}

/** Everything's in the account: move any photos still only on this device there too. */
function saved() {
  setStatus('saved')
  // The copies left in this browser are cleared at the next startup (not now: undo may need them).
  void hostLocalPhotos().catch(() => {})
}

async function pull(replace = false) {
  lastPull = Date.now()
  const { items } = await api<{ items: Partial<Record<SyncKey, Synced>> }>('GET', '/api/data')
  for (const key of SYNC_KEYS) applyRemote(key, items[key], replace)
  if (dirty.size) await flush()
  else saved()
}

function flush(): Promise<void> {
  clearTimeout(saveTimer)
  flushing ??= doFlush().finally(() => {
    flushing = undefined
    // Edits made while saving.
    if (dirty.size && useAccountStore.getState().status === 'saving') saveTimer = setTimeout(() => void flush(), SAVE_DELAY_MS)
  })
  return flushing
}

async function doFlush() {
  if (!signedIn()) return
  let attempts = 0
  while (dirty.size && attempts++ < 20) {
    const key = dirty.values().next().value as SyncKey
    dirty.delete(key)
    const a = ADAPTERS[key]
    const base = readMeta().base[key]
    const local = a.get()
    if (base && same(local, base.data)) continue

    const body = JSON.stringify(local)
    if (new TextEncoder().encode(body).length > MAX_BLOB_BYTES) {
      setStatus('error', `Your ${key === 'garage' ? 'garage' : key} is too big to save to your account.`)
      continue
    }
    try {
      // keepalive lets a save finish after the tab closes (browsers cap those bodies at 64 KB).
      const keepalive = document.visibilityState === 'hidden' && body.length < 60_000
      const { version } = await api<{ version: number }>('PUT', `/api/data/${key}`, body, { 'X-Base-Version': String(base?.version ?? 0) }, keepalive)
      setBase(key, { version, data: JSON.parse(body) })
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        // Another device saved first: merge its copy in and try again.
        const remote = err.body?.data == null ? undefined : (err.body as Synced)
        applyRemote(key, remote, false)
        continue
      }
      if (err instanceof HttpError && err.status === 401) return sessionEnded()
      dirty.add(key)
      setStatus('offline', "Couldn't reach your account. Your changes are kept here and will save when you're back online.")
      saveTimer = setTimeout(() => void flush(), retryMs)
      retryMs = Math.min(retryMs * 2, 120_000)
      return
    }
  }
  retryMs = 5000
  if (useAccountStore.getState().status !== 'error') {
    if (dirty.size) setStatus('saving')
    else saved()
  }
}

function sessionEnded() {
  useAccountStore.setState({ user: null, status: 'idle' })
  toast('You were signed out. Sign in again to keep saving to your account.', 'error')
}

/** Starts syncing for a user who just signed in (or was already signed in on load). */
async function startSync(user: AccountUser, fresh: boolean) {
  const meta = readMeta()
  // This browser holds another account's data: show this account's instead of mixing them.
  const replace = !!meta.userId && meta.userId !== user.id
  if (meta.userId !== user.id) writeMeta({ userId: user.id, base: {} })
  useAccountStore.setState({ user, status: 'saving' })
  try {
    await pull(replace)
    if (fresh) toast(`Signed in as ${user.name}. Your bikes and parts now save to your account.`, 'success')
  } catch (err) {
    if (err instanceof HttpError && err.status === 401) return sessionEnded()
    setStatus('offline', "Couldn't reach your account. Your changes are kept here and will save when you're back online.")
    for (const k of SYNC_KEYS) dirty.add(k)
  }
}

// ---------- public ----------

let started = false

/** Called once at startup: finds out whether accounts exist here and who's signed in. */
export async function initAccount() {
  if (started) return
  started = true
  for (const key of SYNC_KEYS) ADAPTERS[key].subscribe(() => markDirty(key))

  let me: { user: AccountUser | null; googleClientId: string; emailSignIn?: boolean; devLogin?: boolean }
  try {
    me = await api('GET', '/api/me')
  } catch {
    return // No account API here (e.g. plain `vite`); everything stays in this browser.
  }
  useAccountStore.setState({ available: true, googleClientId: me.googleClientId, emailSignIn: me.emailSignIn, devLogin: me.devLogin })
  if (me.user) await startSync(me.user, false)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && signedIn() && Date.now() - lastPull > PULL_EVERY_MS) {
      void pull().catch(() => {})
    }
    // Back from opening the emailed link in another tab: that tab signed this browser in.
    if (document.visibilityState === 'visible' && !signedIn() && emailPending) void adoptSession()
    // Leaving the page: send what's pending without waiting for the timer.
    if (document.visibilityState === 'hidden' && dirty.size) void flush()
  })
  window.addEventListener('online', () => { if (signedIn()) void flush() })
}

export async function signInWithGoogle(credential: string) {
  const { user } = await api<{ user: AccountUser }>('POST', '/api/auth/google', JSON.stringify({ credential }))
  useAccountStore.setState({ signInOpen: false })
  await startSync(user, true)
}

let emailPending = false

/** The server's message for a failed sign-in request, or a generic one when it's unreachable. */
const reason = (err: unknown, fallback: string) =>
  new Error(err instanceof HttpError && typeof err.body?.error === 'string' ? err.body.error : fallback)

/** Emails a sign-in link and code. Locally (DEV_LOGIN) the response also carries them, for tests. */
export async function requestEmailSignIn(email: string): Promise<{ dev?: { link: string; code: string } }> {
  try {
    const res = await api<{ dev?: { link: string; code: string } }>('POST', '/api/auth/email', JSON.stringify({ email }))
    emailPending = true
    return res
  } catch (err) {
    throw reason(err, 'Couldn’t send the email. Check your connection and try again.')
  }
}

/** Signs in with the token from an emailed link, or the code typed in from it. */
export async function finishEmailSignIn(proof: { token: string } | { email: string; code: string }) {
  let user: AccountUser
  try {
    ;({ user } = await api<{ user: AccountUser }>('POST', '/api/auth/email/verify', JSON.stringify(proof)))
  } catch (err) {
    throw reason(err, 'Couldn’t reach the server. Check your connection and try again.')
  }
  emailPending = false
  useAccountStore.setState({ signInOpen: false })
  await startSync(user, true)
}

async function adoptSession() {
  const me = await api<{ user: AccountUser | null }>('GET', '/api/me').catch(() => undefined)
  if (!me?.user || signedIn()) return
  emailPending = false
  useAccountStore.setState({ signInOpen: false })
  await startSync(me.user, true)
}

/** Local test accounts (wrangler dev with DEV_LOGIN=1). */
export async function signInForTesting(email: string, name: string) {
  const { user } = await api<{ user: AccountUser }>('POST', '/api/auth/dev', JSON.stringify({ email, name }))
  useAccountStore.setState({ signInOpen: false })
  await startSync(user, true)
}

/** True when some change hasn't reached the account yet. */
export function hasUnsavedChanges(): boolean {
  if (dirty.size) return true
  const { base } = readMeta()
  return SYNC_KEYS.some((k) => !same(ADAPTERS[k].get(), base[k]?.data))
}

/** Saves what's pending, then signs out. `clear` also removes this person's data from the browser. */
export async function signOut({ clear }: { clear: boolean }) {
  await flush().catch(() => {})
  await api('POST', '/api/auth/logout', '{}').catch(() => {})
  window.google?.accounts.id.disableAutoSelect()
  dirty.clear()
  clearTimeout(saveTimer)
  useAccountStore.setState({ user: null, status: 'idle', statusDetail: undefined })
  if (clear) {
    for (const key of SYNC_KEYS) ADAPTERS[key].set(ADAPTERS[key].empty())
    localStorage.removeItem(META_KEY)
    await collectPhotoGarbage().catch(() => {})
  }
  // Without `clear`, the meta keeps the user id: signing back in merges, another account replaces.
}

/** Deletes the account and everything saved to it. This browser keeps its copy, unlinked. */
export async function deleteAccount() {
  await api('DELETE', '/api/me', '{}')
  window.google?.accounts.id.disableAutoSelect()
  dirty.clear()
  clearTimeout(saveTimer)
  localStorage.removeItem(META_KEY)
  useAccountStore.setState({ user: null, status: 'idle', statusDetail: undefined })
}
