import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Part } from '@/types/parts'

interface CustomPartsState {
  parts: Part[]
  addPart: (part: Part) => void
}

export const useCustomPartsStore = create<CustomPartsState>()(
  persist(
    (set, get) => ({
      parts: [],
      addPart: (part) => {
        if (get().parts.some((p) => p.id === part.id)) return
        set((s) => ({ parts: [part, ...s.parts] }))
      },
    }),
    {
      name: 'ppp-custom-parts',
    },
  ),
)
