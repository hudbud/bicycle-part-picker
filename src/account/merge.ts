// Three-way merges for account sync. `base` is what this device last saved to (or pulled
// from) the account; `local` is this browser now; `remote` is the account now. Comparing
// both sides against base tells an edit from a deletion, so nothing deleted on one device
// comes back from the other and nothing edited on either is lost.

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Lists of things with ids (bikes, parts bin items, custom parts). Per item: a change on one
 * side wins; a change on both goes to `pick`; an item one side deleted stays deleted unless
 * the other side changed it since.
 */
export function mergeById<T extends { id?: string }>(
  base: T[] | undefined,
  local: T[],
  remote: T[],
  pick: (local: T, remote: T) => T = (l) => l,
): T[] {
  const byId = (list: T[] | undefined) => new Map((list ?? []).filter((x) => x.id).map((x) => [x.id!, x]))
  const b = byId(base), r = byId(remote)
  const out: T[] = []
  const seen = new Set<string>()

  const decide = (id: string, l: T | undefined, rv: T | undefined): T | undefined => {
    const bv = b.get(id)
    if (l && rv) {
      if (same(l, rv) || same(rv, bv)) return l
      if (same(l, bv)) return rv
      return pick(l, rv)
    }
    const only = l ?? rv
    // Unchanged since base means the other side deleted it.
    return bv && same(only, bv) ? undefined : only
  }

  // Local order first (it's what this person is looking at), then anything new from the account.
  for (const l of local) {
    if (!l.id) { out.push(l); continue }
    seen.add(l.id)
    const v = decide(l.id, l, r.get(l.id))
    if (v) out.push(v)
  }
  for (const rv of remote) {
    if (!rv.id || seen.has(rv.id)) continue
    const v = decide(rv.id, undefined, rv)
    if (v) out.push(v)
  }
  return out
}

/** Flat settings objects: per field, whichever side changed since base wins (local on a tie). */
export function mergeFields<T extends object>(base: T | undefined, local: T, remote: T | undefined): T {
  if (!remote) return local
  // Never synced from this device: the account's settings are the ones this person chose.
  if (!base) return { ...local, ...remote }
  const out = { ...local } as Record<string, unknown>
  const b = base as Record<string, unknown>, r = remote as Record<string, unknown>
  for (const k of Object.keys(r)) {
    if (same(out[k], b[k])) out[k] = r[k]
  }
  return out as T
}

export type WholeMerge<T> = { value: T; conflict?: T }

/**
 * A single value (the current build): one-sided changes win; if both changed, keep local and
 * hand back the remote one as `conflict` so the caller can keep it somewhere.
 */
export function mergeWhole<T>(base: T | undefined, local: T, remote: T | undefined, isEmpty: (v: T) => boolean): WholeMerge<T> {
  if (remote === undefined || same(local, remote) || same(remote, base)) return { value: local }
  if (same(local, base) || isEmpty(local)) return { value: remote }
  if (isEmpty(remote)) return { value: local }
  return { value: local, conflict: remote }
}

/** Newer `updatedAt` wins (bikes); ties go to local. */
export function newerUpdate<T extends { updatedAt?: string }>(local: T, remote: T): T {
  return (remote.updatedAt ?? '') > (local.updatedAt ?? '') ? remote : local
}
