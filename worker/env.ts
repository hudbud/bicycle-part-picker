// The parts of the Workers runtime this Worker uses. Written out by hand so the repo doesn't
// need @cloudflare/workers-types.

export interface D1Result<T = Record<string, unknown>> {
  results: T[]
  success: boolean
  meta: { changes: number }
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<D1Result>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>
}

export interface R2Object {
  body: ReadableStream
  httpEtag: string
  httpMetadata?: { contentType?: string }
}

export interface R2Bucket {
  get(key: string): Promise<R2Object | null>
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  /** Up to 1000 keys per call. */
  delete(keys: string | string[]): Promise<void>
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void
}

export interface Env {
  DB: D1Database
  PHOTOS: R2Bucket
  ASSETS: { fetch(request: Request): Promise<Response> }
  GOOGLE_CLIENT_ID: string
  /** Sends sign-in emails (see worker/email.ts). Either EMAIL or RESEND_API_KEY, with EMAIL_FROM. */
  EMAIL?: { send(message: { from: string; to: string; subject: string; text: string; html: string }): Promise<unknown> }
  RESEND_API_KEY?: string
  /** e.g. "Pedal Parts Picker <sign-in@example.com>", on a domain the email provider has verified. */
  EMAIL_FROM?: string
  /** Most sign-in emails sent per day, all addresses together. Defaults to 100. */
  EMAIL_DAILY_LIMIT?: string
  /** "1" in .dev.vars only: enables POST /api/auth/dev on localhost for tests. */
  DEV_LOGIN?: string
}
