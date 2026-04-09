import { Link } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { BikeTypePill } from '@/components/ui/BikeTypePill'
import { EXAMPLE_BUILDS } from '@/data/exampleBuilds'
import { Window, WindowHeader, WindowContent, GroupBox, Button } from 'react95'
import styled from 'styled-components'

const HeroWindow = styled(Window)`
  width: 100%;
  max-width: 640px;
  margin: 0 auto 16px;
`

const HowItWorksWindow = styled(Window)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto 16px;
`

const StepsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
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
  return (
    <div>
      {/* Hero */}
      <HeroWindow>
        <WindowHeader active><span>Welcome to Pedal Parts Picker</span></WindowHeader>
        <WindowContent style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
            Build your perfect bike.
          </p>
          <p style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Plan your dream build component by component.<br />
            Compare prices, check specs, and share with one link.
          </p>
          <Link to="/build" style={{ textDecoration: 'none' }}>
            <Button size="lg" style={{ fontSize: 14 }}>Start Building →</Button>
          </Link>
        </WindowContent>
      </HeroWindow>

      {/* How it works */}
      <HowItWorksWindow>
        <WindowHeader active><span>How it works</span></WindowHeader>
        <WindowContent>
          <StepsGrid>
            {[
              { n: 1, title: 'Pick your components', desc: 'Browse a curated database of real parts across every category — frames, wheels, drivetrain, and more.' },
              { n: 2, title: 'Track price and status', desc: 'See your total cost update in real time. Mark parts as owned, purchased, or on your wishlist.' },
              { n: 3, title: 'Share with one link', desc: 'Generate a shareable URL for your complete build spec — no account required to view.' },
            ].map(({ n, title, desc }) => (
              <GroupBox key={n} label={`${n}. ${title}`}>
                <p style={{ fontSize: 12, lineHeight: 1.6 }}>{desc}</p>
              </GroupBox>
            ))}
          </StepsGrid>
        </WindowContent>
      </HowItWorksWindow>

      {/* Example builds */}
      <ExamplesWindow>
        <WindowHeader active><span>Example Builds</span></WindowHeader>
        <WindowContent>
          <ExampleGrid>
            {EXAMPLE_BUILDS.map((build) => {
              const total = build.components.reduce((s, c) => s + (c.part?.price ?? 0), 0)
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
                    <p style={{ fontSize: 11, marginTop: 6 }}>{build.components.length} components</p>
                  </WindowContent>
                </ExampleWindow>
              )
            })}
          </ExampleGrid>
        </WindowContent>
      </ExamplesWindow>

      <Footer />
    </div>
  )
}
