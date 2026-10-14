// Account API for Pedal Parts Picker. Only /api/* reaches this Worker (see run_worker_first in
// wrangler.jsonc); the site itself is served straight from the static assets.
//
//   GET    /api/me             who's signed in, and which ways to sign in work here
//   DELETE /api/me             delete the account and everything saved to it
//   POST   /api/auth/google    { credential } from Sign in with Google → session cookie
//   POST   /api/auth/email     { email } → emails a sign-in link and code (worker/email.ts)
//   POST   /api/auth/email/verify  { token } from the link, or { email, code } → session cookie
//   POST   /api/auth/dev       { email, name } — local test sign-in, localhost + DEV_LOGIN only
//   POST   /api/auth/logout
//   GET    /api/data           every saved blob with its version
//   PUT    /api/data/:key      body = the blob, X-Base-Version = version it was based on
//   POST   /api/photos         body = image bytes → { id, url }
//   GET    /api/photos/:id     the image (public: anyone with the link)

import { isSyncKey, MAX_BLOB_BYTES, type AccountUser } from '../src/account/syncKeys'
import { randomToken, sha256 } from './crypto'
import { canSendEmail, finishEmailSignIn, normalizeEmail, startEmailSignIn } from './email'
import { verifyGoogleIdToken } from './google'
import { collectPhotos, deleteAllPhotos, servePhoto, uploadPhoto } from './photos'
import type { Env, ExecutionContext } from './env'

const COOKIE = 'ppp_session'
const SESSION_DAYS = 90
const DAY_MS = 86_400_000

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } })

const error = (status: number, message: string) => json({ error: message }, status)

function sessionCookie(token: string, maxAgeS: number): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeS}`
}

function readCookie(req: Request): string | undefined {
  const raw = req.headers.get('Cookie') ?? ''
  return raw.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || undefined
}

const isLocal = (url: URL) => url.hostname === 'localhost' || url.hostname === '127.0.0.1'

/** Local tests: test sign-in, and sign-in emails printed to the console instead of sent. */
const devOutbox = (env: Env, url: URL) => env.DEV_LOGIN === '1' && isLocal(url)

/**
 * Writes must come from the site itself: a matching Origin header, and a JSON or text body
 * (which a plain cross-site form can't send without a CORS preflight this Worker never allows).
 */
function sameOrigin(req: Request, url: URL): boolean {
  const origin = req.headers.get('Origin')
  if (!origin) return false
  const o = new URL(origin)
  // Locally the Vite dev server (5173) proxies /api to wrangler dev (8787).
  return o.host === url.host || (isLocal(url) && isLocal(o))
}

interface UserRow { id: string; name: string | null; email: string | null; picture: string | null }

const toUser = (r: UserRow): AccountUser => ({ id: r.id, name: r.name ?? 'Rider', email: r.email ?? '', picture: r.picture ?? undefined })

async function currentSession(req: Request, env: Env): Promise<{ user: AccountUser; tokenHash: string; expiresAt: number } | undefined> {
  const token = readCookie(req)
  if (!token) return undefined
  const tokenHash = await sha256(token)
  const row = await env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.picture, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
  ).bind(tokenHash).first<UserRow & { expires_at: number }>()
  if (!row || row.expires_at < Date.now()) return undefined
  return { user: toUser(row), tokenHash, expiresAt: row.expires_at }
}

/**
 * Someone who has proven who they are: a Google account (`sub`, or `dev:<email>` for local
 * test accounts), or an email address through a sign-in link. `verifiedEmail` links the two,
 * so signing in either way with the same address opens the same account.
 */
interface Identity { sub?: string; email: string; verifiedEmail?: string; name: string; picture?: string }

async function findOrCreateUser(env: Env, id: Identity): Promise<UserRow | null> {
  const now = Date.now()
  const first = (sql: string, ...args: unknown[]) => env.DB.prepare(sql).bind(...args).first<UserRow>()
  const fields = 'id, name, email, picture'

  if (!id.sub) {
    // An email link: the account with that address, or a new one.
    const existing = await first(`UPDATE users SET last_seen_at = ? WHERE verified_email = ? RETURNING ${fields}`, now, id.verifiedEmail)
    return existing ?? first(
      `INSERT INTO users (id, google_sub, email, name, verified_email, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT DO NOTHING RETURNING ${fields}`,
      crypto.randomUUID(), `email:${id.verifiedEmail}`, id.email, id.name, id.verifiedEmail, now, now,
    ) ?? first(`SELECT ${fields} FROM users WHERE verified_email = ?`, id.verifiedEmail) // lost a race with another tab
  }

  let row = await first(`SELECT ${fields} FROM users WHERE google_sub = ?`, id.sub)
  // First Google sign-in for someone who started with an email link: same account.
  if (!row && id.verifiedEmail) row = await first(`UPDATE users SET google_sub = ? WHERE verified_email = ? AND google_sub LIKE 'email:%' RETURNING ${fields}`, id.sub, id.verifiedEmail)
  if (!row) {
    return first(
      `INSERT INTO users (id, google_sub, email, name, picture, verified_email, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, (SELECT ? WHERE NOT EXISTS (SELECT 1 FROM users WHERE verified_email = ?)), ?, ?)
       ON CONFLICT(google_sub) DO UPDATE SET last_seen_at = excluded.last_seen_at
       RETURNING ${fields}`,
      crypto.randomUUID(), id.sub, id.email, id.name, id.picture ?? null, id.verifiedEmail ?? null, id.verifiedEmail ?? null, now, now,
    )
  }
  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET email = ?, name = ?, picture = ?, last_seen_at = ? WHERE id = ?`).bind(id.email, id.name, id.picture ?? null, now, row.id),
    // Ignored if another account already has the address (two Google accounts, one email).
    env.DB.prepare(`UPDATE OR IGNORE users SET verified_email = ? WHERE id = ? AND verified_email IS NULL`).bind(id.verifiedEmail ?? null, row.id),
  ])
  return { id: row.id, email: id.email, name: id.name, picture: id.picture ?? null }
}

/** Finds or creates the account for an identity and starts a session. */
async function signIn(env: Env, identity: Identity): Promise<Response> {
  const user = await findOrCreateUser(env, identity)
  if (!user) return error(500, 'Could not create the account')

  const now = Date.now()
  const token = randomToken()
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM sessions WHERE user_id = ? AND expires_at < ?`).bind(user.id, now),
    env.DB.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)`).bind(await sha256(token), user.id, now + SESSION_DAYS * DAY_MS),
  ])
  return json({ user: toUser(user) }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86_400) })
}

async function readJson(req: Request): Promise<Record<string, unknown> | undefined> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

async function handle(req: Request, env: Env, url: URL, ctx: ExecutionContext): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, '')
  const method = req.method

  if (method !== 'GET' && !sameOrigin(req, url)) return error(403, 'Cross-site request refused')

  if (path === '/api/me' && method === 'GET') {
    const devLogin = devOutbox(env, url)
    const session = await currentSession(req, env)
    const base = { googleClientId: env.GOOGLE_CLIENT_ID, emailSignIn: canSendEmail(env, devLogin), ...(devLogin ? { devLogin } : {}) }
    if (!session) return json({ ...base, user: null })
    // Sliding expiry: anyone who keeps using the site stays signed in.
    if (session.expiresAt - Date.now() < (SESSION_DAYS / 2) * DAY_MS) {
      const token = readCookie(req)!
      await env.DB.prepare(`UPDATE sessions SET expires_at = ? WHERE token_hash = ?`).bind(Date.now() + SESSION_DAYS * DAY_MS, session.tokenHash).run()
      return json({ ...base, user: session.user }, 200, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86_400) })
    }
    return json({ ...base, user: session.user })
  }

  if (path === '/api/auth/google' && method === 'POST') {
    const body = await readJson(req)
    if (typeof body?.credential !== 'string') return error(400, 'Missing credential')
    const profile = await verifyGoogleIdToken(body.credential, env.GOOGLE_CLIENT_ID)
    if (typeof profile === 'string') return error(401, `Google sign-in refused: ${profile}`)
    const verifiedEmail = profile.emailVerified ? normalizeEmail(profile.email) : undefined
    return signIn(env, { sub: profile.sub, email: profile.email, verifiedEmail, name: profile.name, picture: profile.picture })
  }

  if (path === '/api/auth/email' && method === 'POST') {
    const body = await readJson(req)
    const email = normalizeEmail(body?.email)
    if (!email) return error(400, 'That doesn’t look like an email address')
    const ip = req.headers.get('CF-Connecting-IP') ?? 'local'
    const result = await startEmailSignIn(env, email, ip, url.origin, devOutbox(env, url))
    return result.ok ? json(result) : error(result.status, result.error)
  }

  if (path === '/api/auth/email/verify' && method === 'POST') {
    const body = await readJson(req)
    const email = body && (await finishEmailSignIn(env, body))
    if (!email) return error(401, typeof body?.token === 'string' ? 'This link has expired or was already used.' : 'That code isn’t right, or it has expired.')
    return signIn(env, { email, verifiedEmail: email, name: email.split('@')[0] })
  }

  if (path === '/api/auth/dev' && method === 'POST') {
    if (!devOutbox(env, url)) return error(404, 'Not found')
    const body = await readJson(req)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email) return error(400, 'Missing email')
    const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : email.split('@')[0]
    // `verified` stands in for a Google account whose email Google has checked.
    return signIn(env, { sub: `dev:${email}`, email, name, verifiedEmail: body?.verified === true ? email : undefined })
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    const token = readCookie(req)
    if (token) await env.DB.prepare(`DELETE FROM sessions WHERE token_hash = ?`).bind(await sha256(token)).run()
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) })
  }

  const photoId = /^\/api\/photos\/([A-Za-z0-9_-]{22,})$/.exec(path)?.[1]
  if (photoId && method === 'GET') return servePhoto(req, env, photoId)

  // Everything below needs a session.
  const session = await currentSession(req, env)
  if (!session) return error(401, 'Not signed in')
  const userId = session.user.id

  if (path === '/api/me' && method === 'DELETE') {
    await deleteAllPhotos(env, userId)
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM user_data WHERE user_id = ?`).bind(userId),
      env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(userId),
      env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(userId),
    ])
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) })
  }

  if (path === '/api/data' && method === 'GET') {
    const { results } = await env.DB.prepare(`SELECT key, data, version FROM user_data WHERE user_id = ?`).bind(userId).all<{ key: string; data: string; version: number }>()
    // Blobs are stored as JSON text; splice them in rather than parse and re-serialize.
    const items = results.map((r) => `${JSON.stringify(r.key)}:{"version":${r.version},"data":${r.data}}`).join(',')
    return new Response(`{"items":{${items}}}`, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  }

  const dataKey = /^\/api\/data\/([A-Za-z]+)$/.exec(path)?.[1]
  if (dataKey && method === 'PUT') {
    if (!isSyncKey(dataKey)) return error(404, 'Unknown data key')
    const baseVersion = Number(req.headers.get('X-Base-Version') ?? 'NaN')
    if (!Number.isInteger(baseVersion) || baseVersion < 0) return error(400, 'Missing X-Base-Version')
    const text = await req.text()
    if (new TextEncoder().encode(text).length > MAX_BLOB_BYTES) return error(413, 'Too big to save')
    try {
      JSON.parse(text)
    } catch {
      return error(400, 'Body is not JSON')
    }

    const now = Date.now()
    // Compare-and-swap on the version, so two devices can't silently overwrite each other.
    const res = baseVersion === 0
      ? await env.DB.prepare(`INSERT INTO user_data (user_id, key, data, version, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT DO NOTHING`).bind(userId, dataKey, text, now).run()
      : await env.DB.prepare(`UPDATE user_data SET data = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND key = ? AND version = ?`).bind(text, now, userId, dataKey, baseVersion).run()
    if (res.meta.changes === 1) {
      if (dataKey === 'garage' || dataKey === 'build') ctx.waitUntil(collectPhotos(env, userId).catch((e) => console.error('photo clean-up', e)))
      return json({ version: baseVersion + 1 })
    }

    const current = await env.DB.prepare(`SELECT data, version FROM user_data WHERE user_id = ? AND key = ?`).bind(userId, dataKey).first<{ data: string; version: number }>()
    if (!current) return json({ version: 0, data: null }, 409)
    return new Response(`{"version":${current.version},"data":${current.data}}`, { status: 409, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  }

  if (path === '/api/photos' && method === 'POST') {
    const { status, body } = await uploadPhoto(req, env, userId, url.origin)
    return json(body, status)
  }

  return error(404, 'Not found')
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req)
    try {
      return await handle(req, env, url, ctx)
    } catch (err) {
      console.error(err)
      return error(500, 'Something went wrong')
    }
  },
}
