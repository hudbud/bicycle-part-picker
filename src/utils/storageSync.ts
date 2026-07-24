import { useBuildStore } from '@/store/buildStore'
import { useGarageStore } from '@/store/garageStore'
import { usePartsBinStore } from '@/store/partsBinStore'
import { useCustomPartsStore } from '@/store/customPartsStore'
import { useSettingsStore } from '@/store/settingsStore'

const STORES: Record<string, { persist: { rehydrate: () => void } }> = {
  'ppp-current-build': useBuildStore,
  'ppp-garage': useGarageStore,
  'ppp-parts-bin': usePartsBinStore,
  'ppp-custom-parts': useCustomPartsStore,
  'ppp-settings': useSettingsStore,
}

// Keeps other open tabs in sync when one tab writes to a persisted store's localStorage key.
export function initStorageSync() {
  window.addEventListener('storage', (e) => {
    if (!e.key) return
    STORES[e.key]?.persist.rehydrate()
  })
}
