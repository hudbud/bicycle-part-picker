import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Build } from '@/types/build'
import { quotaSafeStorage } from '@/utils/persistStorage'

interface GarageState {
  builds: Build[]
  saveBuild: (build: Build) => Build
  updateBuild: (build: Build) => void
  deleteBuild: (id: string) => void
  getBuildById: (id: string) => Build | undefined
  importBuilds: (builds: Build[]) => number
}

export const useGarageStore = create<GarageState>()(
  persist(
    (set, get) => ({
      builds: [],

      saveBuild: (build) => {
        const now = new Date().toISOString()
        const saved: Build = {
          ...build,
          id: build.id ?? crypto.randomUUID(),
          createdAt: build.createdAt ?? now,
          updatedAt: now,
        }
        set((s) => ({
          builds: [
            saved,
            ...s.builds.filter((b) => b.id !== saved.id),
          ],
        }))
        return saved
      },

      updateBuild: (build) => {
        const now = new Date().toISOString()
        set((s) => ({
          builds: s.builds.map((b) =>
            b.id === build.id ? { ...build, updatedAt: now } : b,
          ),
        }))
      },

      deleteBuild: (id) =>
        set((s) => ({ builds: s.builds.filter((b) => b.id !== id) })),

      getBuildById: (id) => get().builds.find((b) => b.id === id),

      // Adds builds from a backup file that aren't already present (by id) — never overwrites existing builds.
      importBuilds: (builds) => {
        const existingIds = new Set(get().builds.map((b) => b.id))
        const toAdd = builds.filter((b) => !b.id || !existingIds.has(b.id))
        if (toAdd.length === 0) return 0
        const now = new Date().toISOString()
        const withIds = toAdd.map((b) => ({ ...b, id: b.id ?? crypto.randomUUID(), createdAt: b.createdAt ?? now, updatedAt: now }))
        set((s) => ({ builds: [...withIds, ...s.builds] }))
        return withIds.length
      },
    }),
    {
      name: 'ppp-garage',
      storage: createJSONStorage(() => quotaSafeStorage),
    },
  ),
)
