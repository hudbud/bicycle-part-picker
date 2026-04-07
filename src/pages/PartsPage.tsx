import { useState, useMemo } from 'react'
import { usePartsBinStore } from '@/store/partsBinStore'
import { useAuthStore } from '@/store/authStore'
import { PartsBinTable } from '@/components/parts-bin/PartsBinTable'
import { AddPartForm } from '@/components/parts-bin/AddPartForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuthModal } from '@/components/auth/AuthModal'
import { Button } from '@/components/ui/Button'
import type { PartStatus } from '@/types/build'

const STATUS_FILTERS: { value: PartStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'owned', label: 'Owned' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'partsbin', label: 'In Parts Bin' },
  { value: 'wanted', label: 'Wanted' },
]

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
    </svg>
  )
}

export function PartsPage() {
  const { items, getTotalValue } = usePartsBinStore()
  const { isAuthenticated } = useAuthStore()
  const [showAdd, setShowAdd] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [statusFilter, setStatusFilter] = useState<PartStatus | 'all'>('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter((i) => i.status === statusFilter)
  }, [items, statusFilter])

  if (!isAuthenticated) {
    return (
      <>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <EmptyState
            icon={<BoxIcon />}
            heading="Sign in to view your Parts Bin"
            subtext="Track parts you own, purchased, or want to buy."
            action={{ label: 'Sign in', onClick: () => setShowAuth(true) }}
          />
        </div>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Parts Bin</h1>
          {items.length > 0 && (
            <p className="text-sm text-text-secondary mt-1">
              Total value: <span className="font-medium text-text-primary">${getTotalValue().toLocaleString()}</span>
            </p>
          )}
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Part
        </Button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === f.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-transparent text-text-secondary border-border-default hover:border-border-strong'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<BoxIcon />}
          heading="Your parts bin is empty"
          subtext="Add parts you own or want to track."
          action={{ label: '+ Add Part', onClick: () => setShowAdd(true) }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          heading="No parts match this filter"
          subtext="Try a different status filter."
        />
      ) : (
        <PartsBinTable items={filtered} />
      )}

      <AddPartForm open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
