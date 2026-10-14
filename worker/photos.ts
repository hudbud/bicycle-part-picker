// Hosted bike photos: bytes in R2, ownership in D1. Photos are public to anyone with the link
// (ids are random and unguessable), so shared bike pages can show them.

import { MAX_PHOTO_BYTES, HOSTED_PHOTO } from '../src/account/syncKeys'
import type { Env } from './env'

const MAX_PHOTOS_PER_USER = 2000
const MAX_BYTES_PER_USER = 1_000_000_000
/** How long a photo no bike uses is kept before it's deleted (undo, offline devices). */
const ORPHAN_GRACE_MS = 7 * 86_400_000

const r2Key = (id: string) => `p/${id}`

/** JPEG, PNG, WebP or GIF, going by the file's first bytes rather than what the browser claims. */
function sniffImage(b: Uint8Array): string | undefined {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp'
  return undefined
}

function photoId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_')
}

type Reply = { status: number; body: Record<string, unknown> }

export async function uploadPhoto(req: Request, env: Env, userId: string, origin: string): Promise<Reply> {
  const declared = Number(req.headers.get('Content-Length') ?? 0)
  if (declared > MAX_PHOTO_BYTES) return { status: 413, body: { error: 'Photo too big' } }
  const buf = await req.arrayBuffer()
  if (buf.byteLength > MAX_PHOTO_BYTES) return { status: 413, body: { error: 'Photo too big' } }
  const type = sniffImage(new Uint8Array(buf, 0, Math.min(12, buf.byteLength)))
  if (!type) return { status: 415, body: { error: 'Not a JPEG, PNG, WebP or GIF image' } }

  const usage = await env.DB.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(bytes), 0) AS total FROM photos WHERE user_id = ?`).bind(userId).first<{ n: number; total: number }>()
  if (usage && (usage.n >= MAX_PHOTOS_PER_USER || usage.total + buf.byteLength > MAX_BYTES_PER_USER)) {
    return { status: 507, body: { error: 'Photo storage full for this account' } }
  }

  const id = photoId()
  await env.PHOTOS.put(r2Key(id), buf, { httpMetadata: { contentType: type } })
  await env.DB.prepare(`INSERT INTO photos (id, user_id, bytes, created_at) VALUES (?, ?, ?, ?)`).bind(id, userId, buf.byteLength, Date.now()).run()
  return { status: 201, body: { id, url: `${origin}/api/photos/${id}` } }
}

export async function servePhoto(req: Request, env: Env, id: string): Promise<Response> {
  const etag = req.headers.get('If-None-Match')
  const obj = await env.PHOTOS.get(r2Key(id))
  if (!obj) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  const headers = {
    'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
    // A photo never changes under its id.
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: obj.httpEtag,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'",
    'Cross-Origin-Resource-Policy': 'cross-origin',
  }
  if (etag && etag === obj.httpEtag) return new Response(null, { status: 304, headers })
  return new Response(obj.body, { headers })
}

async function deleteRows(env: Env, ids: string[]) {
  // D1 takes at most 100 bound values per statement.
  for (let i = 0; i < ids.length; i += 90) {
    const chunk = ids.slice(i, i + 90)
    await env.PHOTOS.delete(chunk.map(r2Key))
    await env.DB.prepare(`DELETE FROM photos WHERE id IN (${chunk.map(() => '?').join(',')})`).bind(...chunk).run()
  }
}

/**
 * Marks this user's photos that no bike (garage or builder) uses any more, and deletes the ones
 * that have stayed unused for a week. Runs after the garage or builder is saved.
 */
export async function collectPhotos(env: Env, userId: string): Promise<void> {
  const { results: photos } = await env.DB.prepare(`SELECT id, orphaned_at FROM photos WHERE user_id = ?`).bind(userId).all<{ id: string; orphaned_at: number | null }>()
  if (!photos.length) return
  const { results: blobs } = await env.DB.prepare(`SELECT data FROM user_data WHERE user_id = ? AND key IN ('garage', 'build')`).bind(userId).all<{ data: string }>()
  const used = new Set<string>()
  const re = new RegExp(HOSTED_PHOTO.source, 'g')
  for (const { data } of blobs) for (const m of data.matchAll(re)) used.add(m[1])

  const now = Date.now()
  const adopt: string[] = [], orphan: string[] = [], expired: string[] = []
  for (const p of photos) {
    if (used.has(p.id)) { if (p.orphaned_at != null) adopt.push(p.id) }
    else if (p.orphaned_at == null) orphan.push(p.id)
    else if (now - p.orphaned_at > ORPHAN_GRACE_MS) expired.push(p.id)
  }
  const mark = (ids: string[], value: number | null) =>
    ids.length ? env.DB.prepare(`UPDATE photos SET orphaned_at = ? WHERE user_id = ? AND id IN (${ids.map(() => '?').join(',')})`).bind(value, userId, ...ids).run() : undefined
  // Fresh uploads haven't reached a saved bike yet; the grace period covers them too.
  await mark(adopt.slice(0, 90), null)
  await mark(orphan.slice(0, 90), now)
  if (expired.length) await deleteRows(env, expired)
}

/** Every photo this user uploaded, for account deletion. */
export async function deleteAllPhotos(env: Env, userId: string): Promise<void> {
  const { results } = await env.DB.prepare(`SELECT id FROM photos WHERE user_id = ?`).bind(userId).all<{ id: string }>()
  if (results.length) await deleteRows(env, results.map((r) => r.id))
}
