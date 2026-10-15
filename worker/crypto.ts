/** Base64 SHA-256 of a string: what's stored in place of tokens, so the tables can't be used to sign in. */
export async function sha256(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=+$/, '')
}

/** 32 random bytes, base64url. */
export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
