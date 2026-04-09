import { useState } from 'react'
import { useBuildStore } from '@/store/buildStore'
import { useBuildShare } from '@/hooks/useBuildShare'
import { Button } from '@/components/ui/Button'
import { SaveBuildDialog } from './SaveBuildDialog'
import { ExportMenu } from './ExportMenu'
import { AuthModal } from '@/components/auth/AuthModal'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { AppBar, Toolbar } from 'react95'

export function BuilderFooter() {
  const { getTotalPrice, hasMissingPrices } = useBuildStore()
  const { copyShareLink } = useBuildShare()
  const isMobile = useIsMobile()

  const [showSave, setShowSave] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  const total = getTotalPrice()
  const missing = hasMissingPrices()
  const priceLabel = total > 0 ? `${missing ? '~' : ''}$${total.toLocaleString()}` : '—'

  return (
    <>
      <AppBar position="sticky" style={{ bottom: 0, top: 'auto', zIndex: 20 }}>
        <Toolbar style={{ justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 11, marginRight: 6 }}>Total:</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{priceLabel}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!isMobile && <ExportMenu />}
            <Button variant="secondary" size="sm" onClick={copyShareLink}>Share</Button>
            <Button size="sm" onClick={() => setShowSave(true)}>Save Build</Button>
          </div>
        </Toolbar>
      </AppBar>

      <SaveBuildDialog open={showSave} onClose={() => setShowSave(false)} onNeedAuth={() => setShowAuth(true)} />
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} onSuccess={() => setShowSave(true)} />
    </>
  )
}
