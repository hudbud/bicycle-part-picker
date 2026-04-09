import { Link } from 'react-router-dom'
import { Window, WindowHeader, WindowContent, GroupBox } from 'react95'
import styled from 'styled-components'
import { Button } from '@/components/ui/Button'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`

const Section = styled(GroupBox)`
  margin-bottom: 16px;
`

const Body = styled.p`
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 8px;
`

const Steps = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
`

const StepItem = styled.li`
  display: flex;
  gap: 10px;
  font-size: 13px;
  align-items: flex-start;
`

const StepNum = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
`

export function AboutPage() {
  return (
    <PageWindow>
      <WindowHeader active><span>About Pedal Parts Picker</span></WindowHeader>
      <WindowContent>
        <p style={{ fontSize: 11, marginBottom: 16 }}>The definitive tool for planning a custom bicycle build.</p>

        <Section label="What is Pedal Parts Picker?">
          <Body>Pedal Parts Picker is a structured, component-by-component bike build planner — like PCPartPicker.com, but for cyclists. We built it because planning a custom bike is hard. Parts live across a dozen browser tabs, forum threads, and spreadsheets.</Body>
          <Body>The core loop is simple: pick a category → search and browse parts → add to your build → see your full spec with live pricing. No account required to build and share.</Body>
        </Section>

        <Section label="How it works">
          <Steps>
            {[
              'Choose your bike type (Road, MTB, Gravel, Track, BMX)',
              'Browse and select parts for each component category',
              'Track part status — owned, purchased, wanted, or in your parts bin',
              'See your total cost update in real time',
              'Share your build with a single link — no login required to view',
            ].map((text, i) => (
              <StepItem key={i}>
                <StepNum>{i + 1}</StepNum>
                <span>{text}</span>
              </StepItem>
            ))}
          </Steps>
        </Section>

        <Section label="What's coming">
          <Body>We're building Pedal Parts Picker in public. On the roadmap:</Body>
          <ul style={{ fontSize: 13, paddingLeft: 16, lineHeight: 1.8 }}>
            <li>Compatibility checking — flag incompatible component combos</li>
            <li>Price tracking — watch for price drops on parts you want</li>
            <li>Community builds — browse and fork builds from other cyclists</li>
            <li>Gear ratio calculator</li>
            <li>Import from a spreadsheet</li>
          </ul>
        </Section>

        <Section label="Open source &amp; contact">
          <Body>
            Pedal Parts Picker is open source. Contributions and bug reports welcome on{' '}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>GitHub</a>.
          </Body>
          <Body>
            Questions? Reach us at{' '}
            <a href="mailto:hello@pedalpartspicker.com" style={{ textDecoration: 'underline' }}>hello@pedalpartspicker.com</a>
          </Body>
        </Section>

        <Link to="/build" style={{ textDecoration: 'none' }}>
          <Button>Start your build →</Button>
        </Link>
      </WindowContent>
    </PageWindow>
  )
}
