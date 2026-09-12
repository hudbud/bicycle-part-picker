import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGarageStore } from '@/store/garageStore'
import { usePartsBinStore } from '@/store/partsBinStore'
import { useBuildStore } from '@/store/buildStore'
import { BuildCard } from '@/components/garage/BuildCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { parseBuildFile } from '@/utils/buildCodec'
import { buildGarageBackup, parseGarageBackup, sanitizeFilename } from '@/utils/backup'
import { Window, WindowHeader, WindowContent } from 'react95'
import styled from 'styled-components'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 960px;
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
`

export function GaragePage() {
  const navigate = useNavigate()
  const { builds, saveBuild, importBuilds } = useGarageStore()
  const { items: partsBinItems, importItems } = usePartsBinStore()
  const { resetBuild, hasUnsavedWork } = useBuildStore()
  const { success, error } = useToast()
  const importBuildRef = useRef<HTMLInputElement>(null)
  const importBackupRef = useRef<HTMLInputElement>(null)
  const [confirmNew, setConfirmNew] = useState(false)

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
    success('Build added to garage')
  }

  const handleExportBackup = () => {
    const content = buildGarageBackup(builds, partsBinItems)
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
    const addedBuilds = importBuilds(parsed.builds)
    const addedParts = importItems(parsed.partsBin)
    success(`Imported ${addedBuilds} build${addedBuilds === 1 ? '' : 's'} and ${addedParts} part${addedParts === 1 ? '' : 's'}`)
  }

  return (
    <PageWindow>
      <WindowHeader active><span>My Garage</span></WindowHeader>
      <WindowContent>
        <HeaderRow>
          <span style={{ fontSize: 13 }}>{builds.length} saved build{builds.length !== 1 ? 's' : ''}</span>
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
            <Button variant="secondary" size="sm" onClick={handleNewBuild}>+ New Build</Button>
          </Actions>
        </HeaderRow>

        <input ref={importBuildRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportBuild} />
        <input ref={importBackupRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImportBackup} />

        {builds.length === 0 ? (
          <EmptyState
            heading="No saved builds yet"
            subtext="Start planning a build and save it here."
            action={{ label: 'Start Building', onClick: handleNewBuild }}
          />
        ) : (
          <Grid>
            {builds.map((build) => (
              <BuildCard key={build.id} build={build} />
            ))}
          </Grid>
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
