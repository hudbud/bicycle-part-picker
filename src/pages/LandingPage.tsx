import { Link } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { BikeTypePill } from '@/components/ui/BikeTypePill'
import { EXAMPLE_BUILDS } from '@/data/exampleBuilds'

function BikeSilhouette() {
  return (
    <svg viewBox="0 0 240 120" fill="none" className="w-full max-w-md opacity-20" aria-hidden="true">
      <circle cx="60" cy="85" r="30" stroke="currentColor" strokeWidth="3" fill="none"/>
      <circle cx="180" cy="85" r="30" stroke="currentColor" strokeWidth="3" fill="none"/>
      <path d="M60 85 L100 30 L150 55 L180 85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M100 30 L180 30" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M100 30 L90 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="180" cy="30" r="4" fill="currentColor"/>
      <path d="M90 50 L70 50 M80 50 L80 65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

function HowItWorksStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
        {number}
      </div>
      <h3 className="font-medium text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-24 sm:py-32 text-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-text-primary">
          <BikeSilhouette />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h1 className="text-5xl sm:text-6xl font-semibold text-text-primary leading-tight tracking-tight">
            Build your<br />
            <span className="text-accent">perfect bike.</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-lg mx-auto">
            Plan your dream build component by component. Compare prices, check specs, and share your build with one link.
          </p>
          <Link
            to="/build"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium px-8 py-3.5 rounded-lg transition-colors text-base"
          >
            Start Building
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border-default bg-bg-surface py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-medium text-text-primary mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <HowItWorksStep
              number={1}
              title="Pick your components"
              description="Browse a curated database of real parts across every category — frames, wheels, drivetrain, and more."
            />
            <HowItWorksStep
              number={2}
              title="Track price and status"
              description="See your total cost update in real time. Mark parts as owned, purchased, or on your wishlist."
            />
            <HowItWorksStep
              number={3}
              title="Share with one link"
              description="Generate a shareable URL for your complete build spec — no account required to view."
            />
          </div>
        </div>
      </section>

      {/* Example builds */}
      <section className="py-16 px-4 bg-bg-page">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-medium text-text-primary mb-2">Example builds</h2>
          <p className="text-text-secondary mb-8">Get inspired by these sample builds.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {EXAMPLE_BUILDS.map((build) => {
              const total = build.components.reduce((s, c) => s + (c.part?.price ?? 0), 0)
              return (
                <div key={build.id} className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-3 hover:border-border-strong transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-text-primary">{build.name}</h3>
                    <BikeTypePill type={build.bikeType} />
                  </div>
                  {build.description && (
                    <p className="text-sm text-text-secondary line-clamp-2">{build.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{build.components.length} components</span>
                    {total > 0 && (
                      <span className="font-medium text-text-primary">${total.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
