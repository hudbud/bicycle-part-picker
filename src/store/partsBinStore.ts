import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Part, PartCategory } from '@/types/parts'
import type { PartStatus } from '@/types/build'

export interface BinItem {
  id: string
  part: Part
  status: PartStatus
  notes?: string
  addedAt: string
}

interface PartsBinState {
  items: BinItem[]
  addItem: (part: Part, status: PartStatus, notes?: string) => void
  updateItem: (id: string, updates: Partial<Omit<BinItem, 'id' | 'addedAt'>>) => void
  removeItem: (id: string) => void
  getTotalValue: () => number
  getByCategory: (category: PartCategory) => BinItem[]
}

export const usePartsBinStore = create<PartsBinState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (part, status, notes) => {
        const item: BinItem = {
          id: crypto.randomUUID(),
          part,
          status,
          notes,
          addedAt: new Date().toISOString(),
        }
        set((s) => ({ items: [item, ...s.items] }))
      },

      updateItem: (id, updates) =>
        set((s) => ({
          items: s.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item,
          ),
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((item) => item.id !== id) })),

      getTotalValue: () =>
        get().items.reduce((sum, item) => sum + (item.part.price ?? 0), 0),

      getByCategory: (category) =>
        get().items.filter((item) => item.part.category === category),
    }),
    {
      name: 'ppp-parts-bin',
    },
  ),
)
