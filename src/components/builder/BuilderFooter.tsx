import { useRef, useState } from 'react'
import { useBuildStore } from '@/store/buildStore'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SaveBuildDialog } from './SaveBuildDialog'
import { ExportMenu } from './ExportMenu'
import { ShareDialog } from '@/components/share/ShareDialog'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import { useCompat } from '@/hooks/useCompat'
import { parseBuildFile } from '@/utils/buildCodec'
import { getBuildTotals, getTrackingTotals } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { weightLabel, weightTooltip } from '@/components/build/buildRows'
import { AppBar, Toolbar } from 'react95'

type Pending = { kind: 'import'; build: NonNullable<ReturnType<typeof parseBuildFile>> } | { kind: 'new' }

export function BuilderFooter() {
  const build = useBuildStore((s) => s.build)
  const hasUnsavedWork = useBuildStore((s) => s.hasUnsavedWork)
  const loadBuild = useBuildStore((s) => s.loadBuild)
  const resetBuild = useBuildStore((s) => s.resetBuild)
  const { success, error } = useToast()
  const compat = useCompat()
  const isMobile = useIsMobile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showSave, setShowSave] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)

  const market = getBuildTotals(build)
  const t = getTrackingTotals(build)
  const hasParts = build.components.some((s) => s.part)
  const spentLabel = t.acquiredCount > 0 ? formatPrice(t.spent) : '—'
  const toBuyLabel = t.toBuyCount > 0 ? `${t.toBuyUnpriced ? '~' : ''}${formatPrice(t.toBuy)}` : '—'

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseBuildFile(text)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!parsed) { error('Not a valid build file'); return }
    if (hasUnsavedWork()) { setPending({ kind: 'import', build: parsed }); return }
    loadBuild(parsed)
    success('Build loaded')
  }

  const startNew = () => {
    if (hasUnsavedWork()) { setPending({ kind: 'new' }); return }
    resetBuild()
    success('New build started')
  }

  const confirmPending = () => {
    if (pending?.kind === 'import') { loadBuild(pending.build); success('Build loaded') }
    if (pending?.kind === 'new') { resetBuild(); success('New build started') }
    setPending(null)
  }

  return (
    <>
      <AppBar position="sticky" style={{ bottom: 0, top: 'auto', zIndex: 20 }}>
        <Toolbar style={{ justifyContent: 'space-between', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? '2px 10px' : 12, whiteSpace: 'nowrap', flexWrap: 'wrap' }}>
            <span title={t.unrecorded ? `${t.unrecorded} part${t.unrecorded === 1 ? '' : 's'} with no price recorded` : 'What you paid for parts you have'}>
              <span style={{ fontSize: 11, marginRight: 4 }}>Spent:</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{spentLabel}</span>
              {t.unrecorded > 0 && <span style={{ fontSize: 11 }}>+?</span>}
            </span>
            <span title={`${t.toBuyCount} part${t.toBuyCount === 1 ? '' : 's'} still to buy, at today's best price`}>
              <span style={{ fontSize: 11, marginRight: 4 }}>To buy:</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{toBuyLabel}</span>
            </span>
            {hasParts && (
              <span style={{ fontSize: 11 }} title={weightTooltip(compat)}>
                Weight: <strong>{weightLabel(compat)}</strong>
              </span>
            )}
            {!isMobile && market.parts > 0 && (
              <span style={{ fontSize: 11, color: 'var(--win-muted)' }} title="Every selected part at today's best (simulated) price">
                Market {market.missingPrices ? '~' : ''}{formatPrice(market.parts)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={startNew}>New Build</Button>
            {!isMobile && (
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                Open…
              </Button>
            )}
            {!isMobile && <ExportMenu />}
            <Button variant="secondary" size="sm" onClick={() => setShowShare(true)} disabled={!hasParts}>Share / Post</Button>
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
      <ShareDialog open={showShare} onClose={() => setShowShare(false)} build={build} />

      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === 'new' ? 'Start a new build?' : 'Replace current build?'}
        message={pending?.kind === 'new'
          ? 'Your current build has never been saved to the Garage. Starting a new one will discard it.'
          : 'You have unsaved changes to the current build. Opening this file will replace them.'}
        confirmLabel={pending?.kind === 'new' ? 'Discard & start new' : 'Replace'}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
