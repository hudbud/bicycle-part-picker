import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGarageStore } from '@/store/garageStore'
import { usePartsBinStore } from '@/store/partsBinStore'
import { useBuildStore } from '@/store/buildStore'
import { BuildCard } from '@/components/garage/BuildCard'
import { AddBikeChoices } from '@/components/import/AddBikeChoices'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { parseBuildFile } from '@/utils/buildCodec'
import { buildGarageBackup, parseGarageBackup, sanitizeFilename } from '@/utils/backup'
import { exportLocalPhotos, importLocalPhotos, migrateLegacyPhotos } from '@/utils/bikePhotos'
import { DistanceUnitToggle } from '@/components/tracking/DistanceUnitToggle'
import { RouterAnchor } from '@/components/build/BuildCells'
import { getTrackingTotals } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { SaveLocation } from '@/components/account/SaveLocation'
import { Window, WindowHeader, WindowContent, Frame } from 'react95'
import styled from 'styled-components'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
`

const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export function GaragePage() {
  const navigate = useNavigate()
  const { builds, saveBuild, importBuilds } = useGarageStore()
  const { items: partsBinItems, importItems } = usePartsBinStore()
  const { resetBuild, hasUnsavedWork } = useBuildStore()
  const currentBuild = useBuildStore((s) => s.build)
  const unsavedBuilder = hasUnsavedWork()
  const allSpent = builds.reduce((sum, b) => sum + getTrackingTotals(b).spent, 0)
  const allToBuy = builds.reduce((sum, b) => sum + getTrackingTotals(b).toBuy, 0)
  const { success, error } = useToast()
  const importBuildRef = useRef<HTMLInputElement>(null)
  const importBackupRef = useRef<HTMLInputElement>(null)
  const [confirmNew, setConfirmNew] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const handleNewBuild = () => {
    if (hasUnsavedWork()) { setConfirmNew(true); return }
    resetBuild()
    navigate('/build')
  }

  const handleImportBuild = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseBuildFile(text)
    if (importBuildRef.current) importBuildRef.current.value = ''
    if (!parsed) { error('Not a valid build file'); return }
    saveBuild({ ...parsed, id: undefined })
    void migrateLegacyPhotos()
    success('Build added to garage')
  }

  const handleExportBackup = async () => {
    const content = buildGarageBackup(builds, partsBinItems, await exportLocalPhotos(builds))
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sanitizeFilename('pedal-parts-picker-backup')}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseGarageBackup(text)
    if (importBackupRef.current) importBackupRef.current.value = ''
    if (!parsed) { error('Not a valid backup file'); return }
    await importLocalPhotos(parsed.photos)
    const addedBuilds = importBuilds(parsed.builds)
    const addedParts = importItems(parsed.partsBin)
    void migrateLegacyPhotos()
    success(`Imported ${addedBuilds} build${addedBuilds === 1 ? '' : 's'} and ${addedParts} part${addedParts === 1 ? '' : 's'}`)
  }

  return (
    <PageWindow>
      <WindowHeader active><span>My Garage — Bikes</span></WindowHeader>
      <WindowContent>
        <HeaderRow>
          <span style={{ fontSize: 13, display: 'inline-flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'baseline' }}>
            <span>{builds.length} bike{builds.length !== 1 ? 's' : ''}</span>
            {builds.length > 0 && (
              <>
                <span>Spent: <strong>{formatPrice(allSpent)}</strong></span>
                <span>Still to buy: <strong>{formatPrice(allToBuy)}</strong></span>
              </>
            )}
          </span>
          <DistanceUnitToggle />
        </HeaderRow>
        <HeaderRow>
          <Actions>
            <Button variant="secondary" size="sm" onClick={() => importBuildRef.current?.click()}>
              Import build…
            </Button>
            <Button variant="secondary" size="sm" onClick={() => importBackupRef.current?.click()}>
              Restore backup…
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportBackup}>
              Export all…
            </Button>
            {builds.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowAdd((v) => !v)} aria-expanded={showAdd}>
                + Add Bike…
              </Button>
            )}
          </Actions>
          <SaveLocation />
        </HeaderRow>

        {unsavedBuilder && (
          <Frame variant="field" style={{ width: '100%', padding: '6px 8px', marginBottom: 8, fontSize: 12, background: 'var(--win-info)', color: 'var(--win-info-text)' }}>
            The Builder has an unsaved bike, <strong>{currentBuild.name}</strong>. Save it to the Garage to track
            mileage and service.{' '}
            <RouterAnchor to="/build">Open Builder →</RouterAnchor>
          </Frame>
        )}

        <input ref={importBuildRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportBuild} />
        <input ref={importBackupRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportBackup} />

        {builds.length === 0 ? (
          <AddBikeChoices
            heading="No bikes yet. Add one to track what you paid, mileage and service."
            onStartFromFrame={handleNewBuild}
          />
        ) : (
          <List>
            {showAdd && <AddBikeChoices onStartFromFrame={handleNewBuild} />}
            {builds.map((build) => (
              <BuildCard key={build.id} build={build} />
            ))}
          </List>
        )}
      </WindowContent>

      <ConfirmDialog
        open={confirmNew}
        title="Discard current build?"
        message="You have unsaved changes to the current build. Starting a new one will discard them."
        confirmLabel="Discard"
        onConfirm={() => { resetBuild(); setConfirmNew(false); navigate('/build') }}
        onCancel={() => setConfirmNew(false)}
      />
    </PageWindow>
  )
}
