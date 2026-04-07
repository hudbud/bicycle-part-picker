// MOCK ONLY — NOT FOR PRODUCTION
// Replace with Supabase Auth in production
import { create } from 'zustand'
import type { User } from '@/types/auth'

const STORAGE_KEY = 'ppp-auth'
const USERS_KEY = 'ppp-auth-users'

interface StoredUser {
  id: string
  email: string
  displayName: string
  passwordHash: string
}

function loadCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function loadUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, StoredUser>) : {}
  } catch {
    return {}
  }
}

function saveUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadCurrentUser(),
  isAuthenticated: loadCurrentUser() !== null,

  login: async (email, password) => {
    const users = loadUsers()
    const stored = users[email.toLowerCase()]
    if (!stored || stored.passwordHash !== btoa(password)) {
      throw new Error('Invalid email or password')
    }
    const user: User = { id: stored.id, email: stored.email, displayName: stored.displayName }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  signup: async (email, password, displayName) => {
    const users = loadUsers()
    if (users[email.toLowerCase()]) {
      throw new Error('An account with this email already exists')
    }
    const stored: StoredUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      displayName,
      passwordHash: btoa(password),
    }
    users[email.toLowerCase()] = stored
    saveUsers(users)
    const user: User = { id: stored.id, email: stored.email, displayName }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ user: null, isAuthenticated: false })
  },
}))
