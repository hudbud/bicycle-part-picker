import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Build, BikeType, ComponentSlot, PartStatus, AdditionalItem } from '@/types/build'
import type { Part, PartCategory } from '@/types/parts'
import { getCategoriesForBikeType } from '@/data/categoryConfig'

const WHEEL_SUB_CATEGORIES: PartCategory[] = ['frontWheel', 'rearWheel', 'hub', 'rim', 'spokes']

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
  toggleWheelsExpanded: () => void
  addAdditionalItem: (item: Omit<AdditionalItem, 'id'>) => void
  updateAdditionalItem: (id: string, changes: Partial<Omit<AdditionalItem, 'id'>>) => void
  removeAdditionalItem: (id: string) => void
  setPhoto: (photo: string | undefined) => void
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
          return { build: { ...s.build, bikeType, components, wheelsExpanded: false } }
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

      toggleWheelsExpanded: () =>
        set((s) => {
          const { wheelsExpanded, components } = s.build
          if (!wheelsExpanded) {
            const wheelsIndex = components.findIndex((c) => c.category === 'wheels')
            if (wheelsIndex === -1) return s
            const subSlots: ComponentSlot[] = WHEEL_SUB_CATEGORIES.map((cat) => ({ category: cat }))
            const newComponents = [
              ...components.slice(0, wheelsIndex),
              ...subSlots,
              ...components.slice(wheelsIndex + 1),
            ]
            return { build: { ...s.build, wheelsExpanded: true, components: newComponents } }
          } else {
            const firstSubIndex = components.findIndex((c) => WHEEL_SUB_CATEGORIES.includes(c.category))
            const newComponents = components.filter((c) => !WHEEL_SUB_CATEGORIES.includes(c.category))
            const wheelsSlot: ComponentSlot = { category: 'wheels' }
            if (firstSubIndex >= 0) {
              newComponents.splice(firstSubIndex, 0, wheelsSlot)
            } else {
              newComponents.push(wheelsSlot)
            }
            return { build: { ...s.build, wheelsExpanded: false, components: newComponents } }
          }
        }),

      addAdditionalItem: (item) =>
        set((s) => ({
          build: {
            ...s.build,
            additionalItems: [
              ...(s.build.additionalItems ?? []),
              { ...item, id: crypto.randomUUID() },
            ],
          },
        })),

      updateAdditionalItem: (id, changes) =>
        set((s) => ({
          build: {
            ...s.build,
            additionalItems: (s.build.additionalItems ?? []).map((item) =>
              item.id === id ? { ...item, ...changes } : item,
            ),
          },
        })),

      removeAdditionalItem: (id) =>
        set((s) => ({
          build: {
            ...s.build,
            additionalItems: (s.build.additionalItems ?? []).filter((item) => item.id !== id),
          },
        })),

      setPhoto: (photo) =>
        set((s) => ({ build: { ...s.build, photo } })),

      resetBuild: () => set({ build: makeDefaultBuild() }),

      loadBuild: (build) => set({ build }),

      getTotalPrice: () => {
        const { build } = get()
        const partsTotal = build.components.reduce((sum, slot) => sum + (slot.part?.price ?? 0), 0)
        const extrasTotal = (build.additionalItems ?? []).reduce((sum, item) => sum + (item.price ?? 0), 0)
        return partsTotal + extrasTotal
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
