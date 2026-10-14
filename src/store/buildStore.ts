import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Build, ComponentSlot, PartStatus, AdditionalItem, BikePhoto } from '@/types/build'
import type { Part, PartCategory } from '@/types/parts'
import { ALL_CATEGORIES, defaultQuantity } from '@/data/categoryConfig'
import { getBuildTotals } from '@/data/pricing'
import { quotaSafeStorage } from '@/utils/persistStorage'

const WHEEL_SUB_CATEGORIES: PartCategory[] = ['frontWheel', 'rearWheel', 'hub', 'rim', 'spokes']

function slotsForAllCategories(existing: ComponentSlot[] = [], wheelsExpanded?: boolean): ComponentSlot[] {
  const map = new Map(existing.map((s) => [s.category, s]))
  const base = ALL_CATEGORIES.map((cat) => map.get(cat.id) ?? { category: cat.id })

  if (!wheelsExpanded) return base

  const wheelsIndex = base.findIndex((c) => c.category === 'wheels')
  if (wheelsIndex === -1) return base

  const subSlots = WHEEL_SUB_CATEGORIES.map((cat) => map.get(cat) ?? { category: cat })
  return [...base.slice(0, wheelsIndex), ...subSlots, ...base.slice(wheelsIndex + 1)]
}

function makeDefaultBuild(): Build {
  return {
    name: 'My Build',
    components: slotsForAllCategories(),
  }
}

/** Drops a category from the hidden rows — a row you put a part in (or take one out of) stays visible. */
function unhide(build: Build, category: PartCategory): Pick<Build, 'hiddenRows'> {
  const rows = build.hiddenRows?.filter((c) => c !== category)
  return { hiddenRows: rows?.length ? rows : undefined }
}

function normalizeBuild(build: Build): Build {
  return {
    ...build,
    components: slotsForAllCategories(build.components, build.wheelsExpanded),
  }
}

interface BuildState {
  build: Build
  setBuildName: (name: string) => void
  /** Puts a part in a slot. Quantity defaults to the category default (tires/rotors = 2). */
  setPart: (category: PartCategory, part: Part, quantity?: number) => void
  setQuantity: (category: PartCategory, quantity: number) => void
  removePart: (category: PartCategory) => void
  /** Puts a whole slot back as it was (part, quantity, status, tracking) — for Undo. */
  restoreSlot: (slot: ComponentSlot) => void
  setPartStatus: (category: PartCategory, status: PartStatus) => void
  clearPartStatus: (category: PartCategory) => void
  toggleWheelsExpanded: () => void
  addAdditionalItem: (item: Omit<AdditionalItem, 'id'>) => void
  updateAdditionalItem: (id: string, changes: Partial<Omit<AdditionalItem, 'id'>>) => void
  removeAdditionalItem: (id: string) => void
  /** Which empty rows the builder hides (a template's list, or [] for every row). */
  setHiddenRows: (rows: PartCategory[]) => void
  hideRow: (category: PartCategory) => void
  showRow: (category: PartCategory) => void
  setPhotos: (photos: BikePhoto[] | undefined) => void
  resetBuild: () => void
  loadBuild: (build: Build) => void
  getTotalPrice: () => number
  getFilledCount: () => number
  hasMissingPrices: () => boolean
  hasUnsavedWork: () => boolean
}

export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      build: makeDefaultBuild(),

      setBuildName: (name) =>
        set((s) => ({ build: { ...s.build, name } })),

      setPart: (category, part, quantity) =>
        set((s) => ({
          build: {
            ...s.build,
            ...unhide(s.build, category),
            components: s.build.components.map((slot) => {
              if (slot.category !== category) return slot
              const qty = quantity ?? slot.quantity ?? defaultQuantity(category)
              // A different part is a different physical thing — its tracking doesn't carry over.
              const { quantity: _q, tracking, ...rest } = slot
              if (tracking && slot.part?.id === part.id) Object.assign(rest, { tracking })
              return qty === 1 ? { ...rest, part } : { ...rest, part, quantity: qty }
            }),
          },
        })),

      setQuantity: (category, quantity) =>
        set((s) => ({
          build: {
            ...s.build,
            components: s.build.components.map((slot) =>
              slot.category === category ? { ...slot, quantity: Math.max(1, Math.min(99, Math.round(quantity))) } : slot,
            ),
          },
        })),

      removePart: (category) =>
        set((s) => ({
          build: {
            ...s.build,
            ...unhide(s.build, category),
            components: s.build.components.map((slot) =>
              slot.category === category ? { category } : slot,
            ),
          },
        })),

      restoreSlot: (restored) =>
        set((s) => ({
          build: {
            ...s.build,
            ...unhide(s.build, restored.category),
            components: s.build.components.map((slot) => (slot.category === restored.category ? restored : slot)),
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

      setHiddenRows: (rows) =>
        set((s) => ({ build: { ...s.build, hiddenRows: rows.length ? [...rows] : undefined } })),

      hideRow: (category) =>
        set((s) => ({ build: { ...s.build, hiddenRows: [...new Set([...(s.build.hiddenRows ?? []), category])] } })),

      showRow: (category) =>
        set((s) => ({ build: { ...s.build, ...unhide(s.build, category) } })),

      setPhotos: (photos) =>
        set((s) => {
          const { photos: _p, ...build } = s.build
          return { build: photos?.length ? { ...build, photos } : build }
        }),

      resetBuild: () => set({ build: makeDefaultBuild() }),

      loadBuild: (build) => set({ build: normalizeBuild(build) }),

      getTotalPrice: () => getBuildTotals(get().build).total,

      getFilledCount: () => {
        return get().build.components.filter((s) => s.part !== undefined).length
      },

      hasMissingPrices: () => getBuildTotals(get().build).missingPrices > 0,

      // True when the current build has parts but has never been saved to the garage —
      // i.e. discarding it (New Build, Load Build, Open…) would lose work with no way to recover it.
      hasUnsavedWork: () => {
        const { build } = get()
        return !build.id && build.components.some((s) => s.part !== undefined)
      },
    }),
    {
      name: 'ppp-current-build',
      storage: createJSONStorage(() => quotaSafeStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<BuildState> | undefined
        if (!p?.build) return current
        return {
          ...current,
          ...p,
          build: normalizeBuild(p.build),
        }
      },
    },
  ),
)
