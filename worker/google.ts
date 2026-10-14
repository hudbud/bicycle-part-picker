// Checks a Google Identity Services ID token (the `credential` from the Sign in with Google
// button): RS256 signature against Google's published keys, then issuer, audience and expiry.
// https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com']
const SKEW_S = 60

export interface GoogleProfile {
  sub: string
  email: string
  emailVerified: boolean
  name: string
  picture?: string
}

interface Jwk { kid: string; kty: string; n: string; e: string; alg?: string }

// Google rotates keys every few days and says how long to cache them (Cache-Control max-age).
let certs: { keys: Map<string, CryptoKey>; expires: number } | undefined

async function googleKey(kid: string): Promise<CryptoKey | undefined> {
  if (!certs || Date.now() > certs.expires || !certs.keys.has(kid)) {
    const res = await fetch(CERTS_URL)
    if (!res.ok) throw new Error(`Google certs: ${res.status}`)
    const { keys } = (await res.json()) as { keys: Jwk[] }
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? 3600)
    const imported = await Promise.all(
      keys.map(async (k) => [k.kid, await crypto.subtle.importKey('jwk', k, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])] as const),
    )
    certs = { keys: new Map(imported), expires: Date.now() + maxAge * 1000 }
  }
  return certs.keys.get(kid)
}

function b64urlBytes(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

const b64urlJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)))

/** The signed-in Google account, or an error message saying why the token was refused. */
export async function verifyGoogleIdToken(token: string, clientId: string): Promise<GoogleProfile | string> {
  const parts = token.split('.')
  if (parts.length !== 3) return 'malformed token'
  const [h, p, sig] = parts
  let header: { alg?: string; kid?: string }, claims: Record<string, unknown>
  try {
    header = b64urlJson(h)
    claims = b64urlJson(p)
  } catch {
    return 'malformed token'
  }
  if (header.alg !== 'RS256' || !header.kid) return 'unexpected algorithm'

  const key = await googleKey(header.kid)
  if (!key) return 'unknown signing key'
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlBytes(sig), new TextEncoder().encode(`${h}.${p}`))
  if (!ok) return 'bad signature'

  const now = Date.now() / 1000
  if (!ISSUERS.includes(String(claims.iss))) return 'wrong issuer'
  if (claims.aud !== clientId) return 'wrong audience'
  if (typeof claims.exp !== 'number' || claims.exp + SKEW_S < now) return 'expired'
  if (typeof claims.sub !== 'string' || !claims.sub) return 'no subject'

  const email = typeof claims.email === 'string' ? claims.email : ''
  return {
    sub: claims.sub,
    email,
    emailVerified: claims.email_verified === true,
    name: typeof claims.name === 'string' && claims.name ? claims.name : email.split('@')[0] || 'Rider',
    picture: typeof claims.picture === 'string' ? claims.picture : undefined,
  }
}
