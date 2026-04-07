import { useState } from 'react'
import { useBuildStore } from '@/store/buildStore'
import { useBuildShare } from '@/hooks/useBuildShare'
import { Button } from '@/components/ui/Button'
import { SaveBuildDialog } from './SaveBuildDialog'
import { ExportMenu } from './ExportMenu'
import { AuthModal } from '@/components/auth/AuthModal'
import { useIsMobile } from '@/hooks/useMediaQuery'

export function BuilderFooter() {
  const { getTotalPrice, hasMissingPrices } = useBuildStore()
  const { copyShareLink } = useBuildShare()
  const isMobile = useIsMobile()

  const [showSave, setShowSave] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  const total = getTotalPrice()
  const missing = hasMissingPrices()

  const priceLabel = total > 0
    ? `${missing ? '~' : ''}$${total.toLocaleString()}`
    : '—'

  return (
    <>
      <div className="sticky bottom-0 z-20 bg-bg-surface/95 backdrop-blur border-t border-border-default">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div>
            <span className="text-text-muted text-xs uppercase tracking-wide mr-2">Total</span>
            <span className="text-lg font-semibold text-text-primary">{priceLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isMobile && <ExportMenu />}
            <Button variant="secondary" size="sm" onClick={copyShareLink}>
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </Button>
            <Button size="sm" onClick={() => setShowSave(true)}>
              Save Build
            </Button>
          </div>
        </div>
      </div>

      <SaveBuildDialog
        open={showSave}
        onClose={() => setShowSave(false)}
        onNeedAuth={() => setShowAuth(true)}
      />
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowSave(true)}
      />
    </>
  )
}
