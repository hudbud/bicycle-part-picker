// Email sign-in: we send a link plus a 6-digit code. The link is for opening on the same
// device; the code is for when it opens somewhere else (a phone's mail app often uses its own
// browser), so it can be typed into the tab that asked. Either works once, for 15 minutes.
//
// Sending needs one of these set up (see wrangler.jsonc), plus EMAIL_FROM on a domain you own:
//   - Cloudflare Email Service: a `send_email` binding named EMAIL (Workers Paid plan)
//   - Resend: `npx wrangler@4 secret put RESEND_API_KEY`
// Neither, locally with DEV_LOGIN=1: the email is printed to the wrangler dev console instead.

import { randomToken, sha256 } from './crypto'
import type { Env } from './env'

const CODE_MINUTES = 15
const MAX_ATTEMPTS = 5
const MINUTE_MS = 60_000
const DAY_MS = 86_400_000

// How many emails can go out. Per address and per network, so the site can't be used to flood
// someone's inbox; per day overall, to stay inside the email provider's quota.
const LIMITS = { perEmail15m: 3, perEmailDay: 10, perIpHour: 10 }
const DEFAULT_DAILY_LIMIT = 100

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/

export function normalizeEmail(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const email = raw.trim().toLowerCase()
  return email.length <= 254 && EMAIL_RE.test(email) ? email : undefined
}

type Sender = (msg: { to: string; subject: string; text: string; html: string }) => Promise<void>

function sender(env: Env, devOutbox: boolean): Sender | undefined {
  const from = env.EMAIL_FROM
  if (env.EMAIL && from) {
    return async (msg) => { await env.EMAIL!.send({ from, ...msg }) }
  }
  if (env.RESEND_API_KEY && from) {
    return async (msg) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
      })
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
    }
  }
  if (devOutbox) return async (msg) => { console.log(`\n--- email to ${msg.to} ---\n${msg.subject}\n\n${msg.text}\n---\n`) }
  return undefined
}

export const canSendEmail = (env: Env, devOutbox: boolean) => !!sender(env, devOutbox)

function randomCode(): string {
  // Rejection sampling keeps every code equally likely.
  const max = Math.floor(0x1_0000_0000 / 1_000_000) * 1_000_000
  for (;;) {
    const [n] = crypto.getRandomValues(new Uint32Array(1))
    if (n < max) return String(n % 1_000_000).padStart(6, '0')
  }
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function message(link: string, code: string) {
  const text = [
    'Sign in to Pedal Parts Picker:',
    link,
    '',
    `Or enter this code: ${code}`,
    '',
    `The link and code work once, for ${CODE_MINUTES} minutes. If you didn't ask to sign in, you can ignore this email.`,
  ].join('\n')
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#000">
<p>Sign in to Pedal Parts Picker:</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;padding:8px 14px;background:#000080;color:#fff;text-decoration:none">Sign in</a></p>
<p>Or enter this code: <strong style="font-size:18px;letter-spacing:2px">${code}</strong></p>
<p style="color:#555;font-size:12px">The link and code work once, for ${CODE_MINUTES} minutes. If you didn't ask to sign in, you can ignore this email.</p>
</div>`
  return { subject: `Your Pedal Parts Picker sign-in code: ${code}`, text, html }
}

export type StartResult =
  | { ok: true; dev?: { link: string; code: string } }
  | { ok: false; status: number; error: string }

/** Emails a sign-in link and code to `email`. */
export async function startEmailSignIn(env: Env, email: string, ip: string, origin: string, devOutbox: boolean): Promise<StartResult> {
  const send = sender(env, devOutbox)
  if (!send) return { ok: false, status: 404, error: 'Email sign-in isn’t set up here' }

  const now = Date.now()
  const count = (sql: string, ...args: unknown[]) => env.DB.prepare(sql).bind(...args).first<{ n: number }>().then((r) => r?.n ?? 0)
  const [email15m, emailDay, ipHour, day] = await Promise.all([
    count(`SELECT count(*) AS n FROM email_codes WHERE email = ? AND created_at > ?`, email, now - 15 * MINUTE_MS),
    count(`SELECT count(*) AS n FROM email_codes WHERE email = ? AND created_at > ?`, email, now - DAY_MS),
    count(`SELECT count(*) AS n FROM email_codes WHERE ip = ? AND created_at > ?`, ip, now - 60 * MINUTE_MS),
    count(`SELECT count(*) AS n FROM email_codes WHERE created_at > ?`, now - DAY_MS),
  ])
  if (email15m >= LIMITS.perEmail15m || emailDay >= LIMITS.perEmailDay) {
    return { ok: false, status: 429, error: 'We’ve sent a few emails to that address already. Check your inbox (and spam), or try again later.' }
  }
  if (ipHour >= LIMITS.perIpHour) return { ok: false, status: 429, error: 'Too many sign-in emails from this network. Try again in an hour.' }
  if (day >= (Number(env.EMAIL_DAILY_LIMIT) || DEFAULT_DAILY_LIMIT)) {
    return { ok: false, status: 429, error: 'Email sign-in is busy today. Try again tomorrow, or sign in with Google.' }
  }

  const token = randomToken()
  const code = randomCode()
  const tokenHash = await sha256(token)
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM email_codes WHERE created_at < ?`).bind(now - DAY_MS),
    env.DB.prepare(`INSERT INTO email_codes (token_hash, email, code_hash, ip, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(tokenHash, email, await sha256(`${tokenHash}:${code}`), ip, now, now + CODE_MINUTES * MINUTE_MS),
  ])

  // The token goes after # so it never reaches a server log or a Referer header.
  const link = `${origin}/sign-in#token=${token}&email=${encodeURIComponent(email)}`
  try {
    await send({ to: email, ...message(link, code) })
  } catch (err) {
    console.error('sending sign-in email', err)
    await env.DB.prepare(`DELETE FROM email_codes WHERE token_hash = ?`).bind(tokenHash).run()
    return { ok: false, status: 502, error: 'Couldn’t send the email. Try again in a moment.' }
  }
  return { ok: true, ...(devOutbox ? { dev: { link, code } } : {}) }
}

/** The address a link token or code proves, using it up; undefined if it's wrong, used or expired. */
export async function finishEmailSignIn(env: Env, proof: { token?: unknown; email?: unknown; code?: unknown }): Promise<string | undefined> {
  const now = Date.now()
  const useUp = (tokenHash: string) =>
    env.DB.prepare(`UPDATE email_codes SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? RETURNING email`)
      .bind(now, tokenHash, now).first<{ email: string }>()

  let email: string | undefined
  if (typeof proof.token === 'string' && proof.token.length >= 40 && proof.token.length <= 64) {
    email = (await useUp(await sha256(proof.token)))?.email
  } else {
    const address = normalizeEmail(proof.email)
    const code = typeof proof.code === 'string' ? proof.code.replace(/\D/g, '') : ''
    if (!address || code.length !== 6) return undefined
    // Each guess uses up an attempt on every open code for the address before it's checked.
    const { results } = await env.DB.prepare(
      `UPDATE email_codes SET attempts = attempts + 1 WHERE email = ? AND used_at IS NULL AND expires_at > ? AND attempts < ? RETURNING token_hash, code_hash`,
    ).bind(address, now, MAX_ATTEMPTS).all<{ token_hash: string; code_hash: string }>()
    for (const r of results) {
      if ((await sha256(`${r.token_hash}:${code}`)) === r.code_hash) {
        email = (await useUp(r.token_hash))?.email
        break
      }
    }
  }
  // Signing in closes every other open link and code for the address.
  if (email) await env.DB.prepare(`UPDATE email_codes SET used_at = ? WHERE email = ? AND used_at IS NULL`).bind(now, email).run()
  return email
}
