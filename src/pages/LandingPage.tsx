import { useNavigate } from 'react-router-dom'
import { Window, WindowHeader, WindowContent, Button } from 'react95'
import styled from 'styled-components'
import { BUILD_GUIDES } from '@/data/guides'
import { COMMUNITY_BUILDS } from '@/data/communityBuilds'
import {
  CardRow,
  CategoryGrid,
  CommunityCard,
  GuideCard,
  PriceDropsList,
  SectionHead,
  SectionWindow,
} from '@/components/home/HomeSections'
import { FeatureList, TrackerSummary } from '@/components/home/TrackerSummary'
import { useGarageStore } from '@/store/garageStore'
import { usePartsBinStore } from '@/store/partsBinStore'

const Page = styled.div`
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Hero = styled(WindowContent)`
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  @media (max-width: 639px) {
    padding: 16px;
  }
`

const HeroTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
  margin: 0;
  @media (max-width: 639px) {
    font-size: 20px;
  }
`

const HeroText = styled.p`
  font-size: 13px;
  line-height: 1.6;
  max-width: 68ch;
  margin: 0;
`

const HeroActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
`

const GroupLabel = styled.h2`
  font-size: 12px;
  font-weight: 700;
  margin: 4px 0 -4px;
  color: #fff;
  text-shadow: 1px 1px 0 #000;
`

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 12px;
  align-items: start;
  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

export function LandingPage() {
  const navigate = useNavigate()
  const guides = BUILD_GUIDES.slice(0, 3)
  const community = COMMUNITY_BUILDS.slice(0, 4)
  const bikeCount = useGarageStore((s) => s.builds.length)
  const binCount = usePartsBinStore((s) => s.items.length)
  const returning = bikeCount > 0 || binCount > 0

  return (
    <Page>
      <Window style={{ width: '100%' }}>
        <WindowHeader active><span>Pedal Parts Picker — build &amp; parts tracker</span></WindowHeader>
        <Hero>
          <HeroTitle>Track your bikes and every part on them.</HeroTitle>
          <HeroText>
            Plan a build with a compatibility checker, see what it weighs, and keep a record of what you paid, where
            each part came from and its condition. Spares and wishlist parts live in the Parts Bin; each bike in your
            Garage keeps its odometer and service log. Works for new builds and vintage restorations alike.
          </HeroText>
          <HeroActions>
            <Button primary style={{ fontWeight: 700 }} onClick={() => navigate(returning ? '/garage' : '/build')}>
              {returning ? 'Open Garage' : 'Start a Build'}
            </Button>
            <Button onClick={() => navigate(returning ? '/build' : '/garage')}>{returning ? 'Builder' : 'Garage'}</Button>
            <Button onClick={() => navigate('/parts')}>Parts Bin</Button>
          </HeroActions>
        </Hero>
      </Window>

      {returning && (
        <SectionWindow>
          <SectionHead title="Your Bikes & Parts" more={{ to: '/garage', label: 'Garage' }} />
          <WindowContent style={{ padding: 10 }}>
            <TrackerSummary />
          </WindowContent>
        </SectionWindow>
      )}

      <SectionWindow>
        <SectionHead title="What it tracks" more={{ to: '/about', label: 'About' }} />
        <WindowContent style={{ padding: 10 }}>
          <FeatureList />
        </WindowContent>
      </SectionWindow>

      <GroupLabel>Browse &amp; research — parts catalog, guides and builds</GroupLabel>

      <TwoCol>
        <SectionWindow>
          <SectionHead title="Parts Catalog" more={{ to: '/products', label: 'All products' }} />
          <WindowContent style={{ padding: 12 }}>
            <CategoryGrid />
          </WindowContent>
        </SectionWindow>

        <SectionWindow>
          <SectionHead title="Price Drops (simulated)" more={{ to: '/trends', label: 'Price trends' }} />
          <WindowContent style={{ padding: 8 }}>
            <PriceDropsList limit={6} />
            <p style={{ fontSize: 11, marginTop: 6, color: 'var(--win-muted)' }}>vs. 30-day high · simulated prices</p>
          </WindowContent>
        </SectionWindow>
      </TwoCol>

      {guides.length > 0 && (
        <SectionWindow>
          <SectionHead title="Featured Build Guides" more={{ to: '/guides', label: 'All guides' }} />
          <WindowContent style={{ padding: 10 }}>
            <CardRow min={260}>
              {guides.map((g) => <GuideCard key={g.id} guide={g} />)}
            </CardRow>
          </WindowContent>
        </SectionWindow>
      )}

      {community.length > 0 && (
        <SectionWindow>
          <SectionHead title="Recent Completed Builds" more={{ to: '/builds', label: 'All completed builds' }} />
          <WindowContent style={{ padding: 10 }}>
            <CardRow min={210}>
              {community.map((b) => <CommunityCard key={b.id} entry={b} />)}
            </CardRow>
          </WindowContent>
        </SectionWindow>
      )}
    </Page>
  )
}
