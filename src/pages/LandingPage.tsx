import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BikeTypePill } from '@/components/ui/BikeTypePill'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EXAMPLE_BUILDS } from '@/data/exampleBuilds'
import { useBuildStore } from '@/store/buildStore'
import { encodeBuildForShare } from '@/utils/buildCodec'
import type { Build } from '@/types/build'
import { Window, WindowHeader, WindowContent, Button } from 'react95'
import styled from 'styled-components'

const HeroWindow = styled(Window)`
  width: 100%;
  max-width: 640px;
  margin: 0 auto 16px;
`

const ExampleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
`

const ExampleWindow = styled(Window)`
  width: 100%;
`

const ExampleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`

const ExamplesWindow = styled(Window)`
  width: 100%;
  max-width: 900px;
  margin: 0 auto 16px;
`

export function LandingPage() {
  const navigate = useNavigate()
  const { loadBuild, hasUnsavedWork } = useBuildStore()
  const [pendingBuild, setPendingBuild] = useState<Build | null>(null)

  const handleUseBuild = (build: Build) => {
    if (hasUnsavedWork()) { setPendingBuild(build); return }
    loadBuild({ ...build, id: undefined, createdAt: undefined, updatedAt: undefined })
    navigate('/build')
  }

  return (
    <div>
      <HeroWindow>
        <WindowHeader active><span>Welcome to Pedal Parts Picker</span></WindowHeader>
        <WindowContent style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
            Build your perfect bike.
          </p>
          <p style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            A sandbox for planning any bike build — add the parts you want,<br />
            track prices, and share with one link.
          </p>
          <Link to="/build" style={{ textDecoration: 'none' }}>
            <Button size="lg" style={{ fontSize: 14 }}>Start Building →</Button>
          </Link>
        </WindowContent>
      </HeroWindow>

      <ExamplesWindow>
        <WindowHeader active><span>Example Builds</span></WindowHeader>
        <WindowContent>
          <ExampleGrid>
            {EXAMPLE_BUILDS.map((build) => {
              const total = build.components.reduce((s, c) => s + (c.part?.price ?? 0), 0)
              const shareUrl = `/build/shared?b=${encodeBuildForShare(build)}`
              return (
                <ExampleWindow key={build.id}>
                  <WindowHeader active={false} style={{ fontSize: 12 }}>
                    <span>{build.name}</span>
                  </WindowHeader>
                  <WindowContent>
                    <ExampleHeader>
                      <BikeTypePill type={build.bikeType} />
                      {total > 0 && <strong style={{ fontSize: 13 }}>${total.toLocaleString()}</strong>}
                    </ExampleHeader>
                    {build.description && (
                      <p style={{ fontSize: 12, lineHeight: 1.5 }}>{build.description}</p>
                    )}
                    <p style={{ fontSize: 11, marginTop: 6, marginBottom: 10 }}>{build.components.length} components</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={shareUrl} style={{ textDecoration: 'none', flex: 1 }}>
                        <Button fullWidth style={{ fontSize: 11 }}>View build</Button>
                      </Link>
                      <Button fullWidth style={{ fontSize: 11, flex: 1 }} onClick={() => handleUseBuild(build)}>
                        Use this build
                      </Button>
                    </div>
                  </WindowContent>
                </ExampleWindow>
              )
            })}
          </ExampleGrid>
        </WindowContent>
      </ExamplesWindow>

      <ConfirmDialog
        open={pendingBuild !== null}
        title="Replace current build?"
        message="You have unsaved changes to the current build. Starting from this example will replace them."
        confirmLabel="Replace"
        onConfirm={() => {
          if (pendingBuild) loadBuild({ ...pendingBuild, id: undefined, createdAt: undefined, updatedAt: undefined })
          setPendingBuild(null)
          navigate('/build')
        }}
        onCancel={() => setPendingBuild(null)}
      />
    </div>
  )
}
