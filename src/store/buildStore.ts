import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Build, BikeType, ComponentSlot, PartStatus } from '@/types/build'
import type { Part, PartCategory } from '@/types/parts'
import { getCategoriesForBikeType } from '@/data/categoryConfig'

function makeDefaultBuild(bikeType: BikeType = 'road'): Build {
  return {
    name: 'My Build',
    bikeType,
    isPublic: false,
    components: getCategoriesForBikeType(bikeType).map((cat) => ({
      category: cat.id,
    })),
  }
}

interface BuildState {
  build: Build
  setBuildName: (name: string) => void
  setBikeType: (type: BikeType) => void
  setPart: (category: PartCategory, part: Part) => void
  removePart: (category: PartCategory) => void
  setPartStatus: (category: PartCategory, status: PartStatus) => void
  clearPartStatus: (category: PartCategory) => void
  resetBuild: () => void
  loadBuild: (build: Build) => void
  getTotalPrice: () => number
  getFilledCount: () => number
  hasMissingPrices: () => boolean
}

export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      build: makeDefaultBuild(),

      setBuildName: (name) =>
        set((s) => ({ build: { ...s.build, name } })),

      setBikeType: (bikeType) =>
        set((s) => {
          const newCategories = getCategoriesForBikeType(bikeType)
          const existingSlotMap = new Map<PartCategory, ComponentSlot>(
            s.build.components.map((slot) => [slot.category, slot]),
          )
          const components = newCategories.map((cat) => {
            return existingSlotMap.get(cat.id) ?? { category: cat.id }
          })
          return { build: { ...s.build, bikeType, components } }
        }),

      setPart: (category, part) =>
        set((s) => ({
          build: {
            ...s.build,
            components: s.build.components.map((slot) =>
              slot.category === category ? { ...slot, part } : slot,
            ),
          },
        })),

      removePart: (category) =>
        set((s) => ({
          build: {
            ...s.build,
            components: s.build.components.map((slot) =>
              slot.category === category ? { category } : slot,
            ),
          },
        })),

      setPartStatus: (category, status) =>
        set((s) => ({
          build: {
            ...s.build,
            components: s.build.components.map((slot) =>
              slot.category === category ? { ...slot, status } : slot,
            ),
          },
        })),

      clearPartStatus: (category) =>
        set((s) => ({
          build: {
            ...s.build,
            components: s.build.components.map((slot) => {
              if (slot.category === category) {
                const { status: _status, ...rest } = slot
                return rest
              }
              return slot
            }),
          },
        })),

      resetBuild: () => set({ build: makeDefaultBuild() }),

      loadBuild: (build) => set({ build }),

      getTotalPrice: () => {
        return get().build.components.reduce((sum, slot) => {
          return sum + (slot.part?.price ?? 0)
        }, 0)
      },

      getFilledCount: () => {
        return get().build.components.filter((s) => s.part !== undefined).length
      },

      hasMissingPrices: () => {
        return get().build.components.some(
          (s) => s.part !== undefined && s.part.price === undefined,
        )
      },
    }),
    {
      name: 'ppp-current-build',
    },
  ),
)
