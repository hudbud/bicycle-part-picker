import { useRef, useState } from 'react'
import { useBuildStore } from '@/store/buildStore'
import { useBuildShare } from '@/hooks/useBuildShare'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SaveBuildDialog } from './SaveBuildDialog'
import { ExportMenu } from './ExportMenu'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import { parseBuildFile } from '@/utils/buildCodec'
import { AppBar, Toolbar } from 'react95'

export function BuilderFooter() {
  const { getTotalPrice, hasMissingPrices, hasUnsavedWork, loadBuild } = useBuildStore()
  const { copyShareLink } = useBuildShare()
  const { success, error } = useToast()
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showSave, setShowSave] = useState(false)
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof parseBuildFile>>(null)

  const total = getTotalPrice()
  const missing = hasMissingPrices()
  const priceLabel = total > 0 ? `${missing ? '~' : ''}$${total.toLocaleString()}` : '—'

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseBuildFile(text)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!parsed) { error('Not a valid build file'); return }
    if (hasUnsavedWork()) { setPendingImport(parsed); return }
    loadBuild(parsed)
    success('Build loaded')
  }

  return (
    <>
      <AppBar position="sticky" style={{ bottom: 0, top: 'auto', zIndex: 20 }}>
        <Toolbar style={{ justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 11, marginRight: 6 }}>Total:</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{priceLabel}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!isMobile && (
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Open…
              </Button>
            )}
            {!isMobile && <ExportMenu />}
            <Button variant="secondary" size="sm" onClick={copyShareLink}>Share</Button>
            <Button size="sm" onClick={() => setShowSave(true)}>Save Build</Button>
          </div>
        </Toolbar>
      </AppBar>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <SaveBuildDialog open={showSave} onClose={() => setShowSave(false)} />

      <ConfirmDialog
        open={pendingImport !== null}
        title="Replace current build?"
        message="You have unsaved changes to the current build. Opening this file will replace them."
        confirmLabel="Replace"
        onConfirm={() => {
          if (pendingImport) loadBuild(pendingImport)
          setPendingImport(null)
          success('Build loaded')
        }}
        onCancel={() => setPendingImport(null)}
      />
    </>
  )
}
