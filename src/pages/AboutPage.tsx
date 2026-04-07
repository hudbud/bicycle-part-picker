import { Link } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-medium text-text-primary">{title}</h2>
      {children}
    </section>
  )
}

export function AboutPage() {
  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary mb-3">About Pedal Parts Picker</h1>
          <p className="text-text-muted text-sm">The definitive tool for planning a custom bicycle build.</p>
        </div>

        <Section title="What is Pedal Parts Picker?">
          <p className="text-text-secondary">
            Pedal Parts Picker is a structured, component-by-component bike build planner — like PCPartPicker.com, but for cyclists. We built it because planning a custom bike is hard. Parts live across a dozen browser tabs, forum threads, and spreadsheets. There's no single place to see your complete build, track what you own, and share it with friends.
          </p>
          <p className="text-text-secondary">
            We wanted something fast, dense, and built for cyclists who actually care about specs. So we built it ourselves.
          </p>
          <p className="text-text-secondary">
            The core loop is simple: pick a category → search and browse parts → add to your build → see your full spec with live pricing. No account required to build and share.
          </p>
        </Section>

        <Section title="How it works">
          <ol className="space-y-3">
            {[
              { step: 1, text: 'Choose your bike type (Road, MTB, Gravel, Track, BMX)' },
              { step: 2, text: 'Browse and select parts for each component category' },
              { step: 3, text: 'Track part status — owned, purchased, wanted, or in your parts bin' },
              { step: 4, text: 'See your total cost update in real time' },
              { step: 5, text: 'Share your build with a single link — no login required to view' },
            ].map(({ step, text }) => (
              <li key={step} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs flex items-center justify-center flex-shrink-0 font-medium mt-0.5">
                  {step}
                </span>
                <span className="text-text-secondary">{text}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Bike types supported">
          <ul className="space-y-2 text-text-secondary">
            {[
              { type: 'Road', desc: 'Road race and endurance bikes — carbon framesets, aero wheels, rim or disc brakes' },
              { type: 'Mountain (MTB)', desc: 'Trail, enduro, and XC builds — suspension forks, dropper posts, wide bars' },
              { type: 'Gravel', desc: 'Adventure and bikepacking rigs — wide tire clearance, mixed terrain components' },
              { type: 'Track / Fixed', desc: 'Track bikes and fixies — simplified drivetrain, no brakes required' },
              { type: 'BMX', desc: 'Street and park builds — frames, bars, cranks, sprockets' },
            ].map(({ type, desc }) => (
              <li key={type} className="flex flex-col">
                <span className="font-medium text-text-primary">{type}</span>
                <span className="text-sm">{desc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="What's coming">
          <p className="text-text-secondary">We're building Pedal Parts Picker in public. Here's what's on the roadmap:</p>
          <ul className="space-y-1.5 text-sm text-text-secondary list-disc list-inside">
            <li>Compatibility checking — flag incompatible component combos</li>
            <li>Price tracking — watch for price drops on parts you want</li>
            <li>Community builds — browse and fork builds from other cyclists</li>
            <li>Comments and reactions on shared builds</li>
            <li>Gear ratio calculator</li>
            <li>Import from a spreadsheet</li>
          </ul>
        </Section>

        <Section title="Open source">
          <p className="text-text-secondary">
            Pedal Parts Picker is open source. Contributions, bug reports, and feature requests are welcome on{' '}
            <a href="https://github.com" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>.
          </p>
        </Section>

        <Section title="Contact">
          <p className="text-text-secondary">
            Questions, feedback, or partnership inquiries? Reach us at{' '}
            <a href="mailto:hello@pedalpartspicker.com" className="text-accent hover:underline">
              hello@pedalpartspicker.com
            </a>
          </p>
        </Section>

        <div className="pt-4">
          <Link
            to="/build"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Start your build
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
