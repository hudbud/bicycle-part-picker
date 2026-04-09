import { useState, useMemo } from 'react'
import { usePartsBinStore } from '@/store/partsBinStore'
import { useAuthStore } from '@/store/authStore'
import { PartsBinTable } from '@/components/parts-bin/PartsBinTable'
import { AddPartForm } from '@/components/parts-bin/AddPartForm'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuthModal } from '@/components/auth/AuthModal'
import { Button } from '@/components/ui/Button'
import type { PartStatus } from '@/types/build'
import { Window, WindowHeader, WindowContent, Toolbar, Button as R95Button } from 'react95'
import styled from 'styled-components'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 1024px;
  margin: 0 auto;
`

const STATUS_FILTERS: { value: PartStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'owned',     label: 'Owned' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'partsbin',  label: 'In Parts Bin' },
  { value: 'wanted',    label: 'Wanted' },
]

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48 }}>
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
        <PageWindow>
          <WindowHeader active><span>Parts Bin</span></WindowHeader>
          <WindowContent>
            <EmptyState
              icon={<BoxIcon />}
              heading="Sign in to view your Parts Bin"
              subtext="Track parts you own, purchased, or want to buy."
              action={{ label: 'Sign in', onClick: () => setShowAuth(true) }}
            />
          </WindowContent>
        </PageWindow>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </>
    )
  }

  return (
    <PageWindow>
      <WindowHeader active><span>Parts Bin</span></WindowHeader>
      <Toolbar style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_FILTERS.map((f) => (
            <R95Button
              key={f.value}
              variant={statusFilter === f.value ? 'raised' : 'flat'}
              onClick={() => setStatusFilter(f.value)}
              style={{ fontSize: 11 }}
            >
              {f.label}
            </R95Button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {items.length > 0 && (
            <span style={{ fontSize: 12 }}>
              Total value: <strong>${getTotalValue().toLocaleString()}</strong>
            </span>
          )}
          <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Part</Button>
        </div>
      </Toolbar>
      <WindowContent>
        {items.length === 0 ? (
          <EmptyState
            icon={<BoxIcon />}
            heading="Your parts bin is empty"
            subtext="Add parts you own or want to track."
            action={{ label: '+ Add Part', onClick: () => setShowAdd(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState heading="No parts match this filter" subtext="Try a different status filter." />
        ) : (
          <PartsBinTable items={filtered} />
        )}
      </WindowContent>
      <AddPartForm open={showAdd} onClose={() => setShowAdd(false)} />
    </PageWindow>
  )
}
