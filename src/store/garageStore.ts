import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Build } from '@/types/build'

interface GarageState {
  builds: Build[]
  saveBuild: (build: Build) => Build
  updateBuild: (build: Build) => void
  deleteBuild: (id: string) => void
  getBuildById: (id: string) => Build | undefined
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
    }),
    {
      name: 'ppp-garage',
    },
  ),
)
