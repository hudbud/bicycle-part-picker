import { create } from 'zustand'
import type { AccountUser } from './syncKeys'

/** idle: not signed in · saving: a save is on its way · saved: the account matches this browser. */
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error'

interface AccountState {
  /** False until /api/me answers, and stays false where there's no account API (plain `vite`). */
  available: boolean
  user: AccountUser | null
  googleClientId?: string
  /** Sign-in links by email work here (the server has a way to send them). */
  emailSignIn?: boolean
  /** Local test sign-in (wrangler dev with DEV_LOGIN=1 only). */
  devLogin?: boolean
  status: SyncStatus
  /** Why the last save failed, for the account menu. */
  statusDetail?: string
  signInOpen: boolean
  setSignInOpen: (open: boolean) => void
}

export const useAccountStore = create<AccountState>()((set) => ({
  available: false,
  user: null,
  status: 'idle',
  signInOpen: false,
  setSignInOpen: (signInOpen) => set({ signInOpen }),
}))
