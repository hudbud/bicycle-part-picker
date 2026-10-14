import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Window, WindowHeader, WindowContent, Toolbar, Button, Frame } from 'react95'
import type { PartCategory } from '@/types/parts'
import type { PartCondition, PartStatus } from '@/types/build'
import { usePartsBinStore, type BinItem } from '@/store/partsBinStore'
import { useGarageStore } from '@/store/garageStore'
import { useBuildStore } from '@/store/buildStore'
import { uninstallToBin } from '@/store/partMoves'
import { useToast } from '@/hooks/useToast'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ACQUIRED_STATUSES } from '@/data/pricing'
import { formatPrice } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'
import { PartsBinTable, type SortKey } from '@/components/parts-bin/PartsBinTable'
import { AddPartForm } from '@/components/parts-bin/AddPartForm'
import { InstallDialog } from '@/components/parts-bin/InstallDialog'
import { TrackingDialog, type TrackingDialogValue } from '@/components/parts-bin/TrackingDialog'
import { BIN_STATUSES, bikeHref, categoryName, categoryOrder, inventoryRows, marketValue, type InventoryRow } from '@/components/parts-bin/inventory'
import { CONDITIONS, STATUS_OPTIONS } from '@/components/tracking/conditions'
import { setSlotStatus, setSlotTracking } from '@/components/tracking/bikeEdits'
import { FieldInput, FieldLabel, FieldSelect } from '@/components/tracking/fields'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
`

const Bar = styled(Toolbar)`
  flex-wrap: wrap;
  gap: 4px 8px;
  justify-content: space-between;
  padding: 4px;
`

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 6px 10px;
  margin-bottom: 8px;
  & > label { min-width: 120px; }
`

const Totals = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 8px;
  @media (max-width: 767px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

const Stat = styled(Frame).attrs({ variant: 'field' })`
  background: var(--win-window);
  color: var(--win-window-text);
  padding: 5px 8px;
  font-size: 11px;
  line-height: 1.35;
  strong {
    display: block;
    font-weight: 700;
    font-size: 15px;
    font-variant-numeric: tabular-nums;
  }
`

const StatusButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  button {
    font-size: 12px;
    padding: 0 8px;
    height: 26px;
  }
`

const Foot = styled.p`
  font-size: 11px;
  color: var(--win-muted);
  margin: 8px 0 0;
  line-height: 1.4;
`

type WhereFilter = 'all' | 'bin' | 'bike'

const STATUS_FILTERS: { value: PartStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...BIN_STATUSES.map((s) => ({ value: s.value, label: s.label })),
]

const isBin = (r: InventoryRow): r is InventoryRow & { kind: 'bin' } => r.kind === 'bin'

export function PartsPage() {
  const items = usePartsBinStore((s) => s.items)
  const updateItem = usePartsBinStore((s) => s.updateItem)
  const removeItem = usePartsBinStore((s) => s.removeItem)
  const importItems = usePartsBinStore((s) => s.importItems)
  const garage = useGarageStore((s) => s.builds)
  const current = useBuildStore((s) => s.build)
  const { success } = useToast()
  const mobile = useMediaQuery('(max-width: 767px)')

  const [showAdd, setShowAdd] = useState(false)
  const [status, setStatus] = useState<PartStatus | 'all'>('all')
  const [where, setWhere] = useState<WhereFilter>('all')
  const [category, setCategory] = useState<PartCategory | ''>('')
  const [condition, setCondition] = useState<PartCondition | ''>('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('category')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [editing, setEditing] = useState<InventoryRow | undefined>()
  const [installing, setInstalling] = useState<BinItem | undefined>()

  const all = useMemo(() => inventoryRows(items, garage, current), [items, garage, current])

  const totals = useMemo(() => {
    let paid = 0
    let unrecorded = 0
    let owned = 0
    let marketNow = 0
    let wish = 0
    let wishCount = 0
    for (const r of all) {
      if (ACQUIRED_STATUSES.has(r.status)) {
        owned++
        if (r.tracking?.pricePaid != null) paid += r.tracking.pricePaid
        else unrecorded++
        marketNow += marketValue(r.part, r.quantity) ?? 0
      } else if (r.status === 'wanted') {
        wishCount++
        wish += marketValue(r.part, r.quantity) ?? 0
      }
    }
    return { paid, unrecorded, owned, marketNow, wish, wishCount, loose: all.filter(isBin).length, onBikes: all.length - all.filter(isBin).length }
  }, [all])

  const categories = useMemo(
    () => [...new Set(all.map((r) => r.category))].sort((a, b) => categoryOrder(a) - categoryOrder(b)),
    [all],
  )

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = all.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (where !== 'all' && r.kind !== where) return false
      if (category && r.category !== category) return false
      if (condition && r.tracking?.condition !== condition) return false
      if (needle) {
        const hay = `${r.part.brand} ${r.part.name} ${r.tracking?.source ?? ''} ${r.tracking?.serial ?? ''} ${r.tracking?.notes ?? r.notes ?? ''} ${r.kind === 'bike' ? r.bike.name : ''}`.toLowerCase()
        if (!needle.split(/\s+/).every((w) => hay.includes(w))) return false
      }
      return true
    })
    const val = (r: InventoryRow): string | number | undefined => {
      switch (sort) {
        case 'part': return `${r.part.brand} ${r.part.name}`.toLowerCase()
        case 'category': return categoryOrder(r.category)
        case 'status': return r.status
        case 'paid': return r.status === 'wanted' ? undefined : r.tracking?.pricePaid
        case 'acquired': return r.tracking?.acquiredAt
        case 'where': return r.kind === 'bin' ? '' : (r.bike.name || '').toLowerCase()
      }
    }
    const sign = dir === 'asc' ? 1 : -1
    return filtered
      .map((r) => ({ r, v: val(r) }))
      .sort((a, b) => {
        if (a.v == null && b.v == null) return 0
        if (a.v == null) return 1
        if (b.v == null) return -1
        const c = typeof a.v === 'number' && typeof b.v === 'number' ? a.v - b.v : String(a.v).localeCompare(String(b.v))
        return c * sign || `${a.r.part.brand} ${a.r.part.name}`.localeCompare(`${b.r.part.brand} ${b.r.part.name}`)
      })
      .map(({ r }) => r)
  }, [all, status, where, category, condition, q, sort, dir])

  const onSort = (k: SortKey) => {
    if (k === sort) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(k)
      setDir(k === 'paid' || k === 'acquired' ? 'desc' : 'asc')
    }
  }

  const nFilters = (status !== 'all' ? 1 : 0) + (where !== 'all' ? 1 : 0) + (category ? 1 : 0) + (condition ? 1 : 0) + (q.trim() ? 1 : 0)
  const clearFilters = () => { setStatus('all'); setWhere('all'); setCategory(''); setCondition(''); setQ('') }

  const remove = (row: InventoryRow & { kind: 'bin' }) => {
    const item = row.item
    removeItem(item.id)
    success(`Removed ${item.part.brand} ${item.part.name}`, { label: 'Undo', onClick: () => importItems([item]) })
  }

  const uninstall = (row: InventoryRow & { kind: 'bike' }) => {
    uninstallToBin(row.ref, row.category)
    success(`${row.part.brand} ${row.part.name} moved from ${row.bike.name || 'your bike'} to the bin`)
  }

  const saveEdit = (v: TrackingDialogValue) => {
    if (!editing) return
    if (editing.kind === 'bin') {
      updateItem(editing.item.id, {
        status: v.status ?? editing.status,
        quantity: v.quantity !== 1 ? v.quantity : undefined,
        tracking: v.tracking,
        // Legacy free-text notes are folded into tracking.notes by the dialog.
        notes: undefined,
      })
    } else {
      const partId = editing.part.id
      setSlotTracking(editing.ref, editing.category, partId, v.tracking)
      if (v.status !== editing.status) setSlotStatus(editing.ref, editing.category, partId, v.status)
    }
    success('Tracking saved')
    setEditing(undefined)
  }

  const empty = all.length === 0

  return (
    <PageWindow>
      <WindowHeader active>
        <span>Parts Bin — inventory</span>
      </WindowHeader>
      <Bar>
        <StatusButtons role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <Button key={f.value} variant={status === f.value ? 'default' : 'thin'} active={status === f.value} onClick={() => setStatus(f.value)}>
              {f.label}
            </Button>
          ))}
        </StatusButtons>
        <Button primary onClick={() => setShowAdd(true)} style={{ fontWeight: 700 }}>
          + Add Part
        </Button>
      </Bar>
      <WindowContent style={{ padding: mobile ? 8 : 12 }}>
        {empty ? (
          <EmptyState
            heading="Nothing tracked yet"
            subtext="Add parts you own, spares and wishlist items — what you paid, where from, condition and serials. Parts you mark Owned on a bike show up here too."
            action={{ label: '+ Add Part', onClick: () => setShowAdd(true) }}
          />
        ) : (
          <>
            <Totals>
              <Stat title="Sum of price paid for owned / purchased / spare parts, in the bin and on bikes">
                Paid for what you own
                <strong>{formatPrice(totals.paid)}{totals.unrecorded > 0 ? '+' : ''}</strong>
                {totals.owned} part{totals.owned === 1 ? '' : 's'}
                {totals.unrecorded > 0 ? ` · ${totals.unrecorded} with no price` : ''}
              </Stat>
              <Stat title="Wanted items at today's best price (used-market estimate for discontinued parts)">
                Wishlist, to buy
                <strong>{formatPrice(totals.wish)}</strong>
                {totals.wishCount} item{totals.wishCount === 1 ? '' : 's'}
              </Stat>
              <Stat title="Loose parts in the bin vs. parts installed on your bikes">
                Where it is
                <strong>{totals.loose} in bin · {totals.onBikes} on bikes</strong>
                across {new Set(all.filter((r) => r.kind === 'bike').map((r) => r.key.split(':')[1])).size} bike(s)
              </Stat>
              <Stat title="What your owned parts would cost at today's simulated prices">
                Market value now
                <strong style={{ fontWeight: 400 }}>{formatPrice(totals.marketNow)}</strong>
                simulated prices
              </Stat>
            </Totals>

            <Filters>
              <FieldLabel>
                Where
                <FieldSelect value={where} onChange={(e) => setWhere(e.target.value as WhereFilter)}>
                  <option value="all">Bin + bikes</option>
                  <option value="bin">Loose in the bin</option>
                  <option value="bike">On a bike</option>
                </FieldSelect>
              </FieldLabel>
              <FieldLabel>
                Category
                <FieldSelect value={category} onChange={(e) => setCategory(e.target.value as PartCategory | '')}>
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c} value={c}>{categoryName(c)}</option>)}
                </FieldSelect>
              </FieldLabel>
              <FieldLabel>
                Condition
                <FieldSelect value={condition} onChange={(e) => setCondition(e.target.value as PartCondition | '')}>
                  <option value="">Any condition</option>
                  {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </FieldSelect>
              </FieldLabel>
              <FieldLabel style={{ flex: '1 1 180px' }}>
                Search
                <FieldInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Part, source, serial, notes, bike…" />
              </FieldLabel>
              {nFilters > 0 && (
                <Button size="sm" onClick={clearFilters} style={{ height: 24 }}>
                  Clear ({nFilters})
                </Button>
              )}
            </Filters>

            <div style={{ fontSize: 12, marginBottom: 4 }}>
              <strong style={{ fontWeight: 700 }}>{rows.length}</strong> of {all.length} part{all.length === 1 ? '' : 's'}
            </div>

            {rows.length === 0 ? (
              <EmptyState heading="No parts match these filters" action={{ label: 'Clear filters', onClick: clearFilters }} />
            ) : (
              <PartsBinTable
                rows={rows}
                sort={sort}
                dir={dir}
                onSort={onSort}
                onEdit={setEditing}
                onInstall={(r) => setInstalling(r.item)}
                onRemove={remove}
                onUninstall={uninstall}
                mobile={mobile}
              />
            )}
            <Foot>
              Parts marked Owned / Purchased / In Parts Bin on your <Link to="/garage" style={{ color: 'var(--win-link)' }}>Garage</Link> bikes
              are listed with the bike they&rsquo;re on. Wanted and planned parts on a bike stay on that bike&rsquo;s to-buy list.
              Everything is stored in this browser.
            </Foot>
          </>
        )}
      </WindowContent>

      <AddPartForm open={showAdd} onClose={() => setShowAdd(false)} />
      <InstallDialog item={installing} onClose={() => setInstalling(undefined)} />
      {editing && (
        <TrackingDialog
          open
          onClose={() => setEditing(undefined)}
          title={editing.kind === 'bin' ? 'Edit bin item' : `Edit part on ${editing.bike.name || 'bike'}`}
          subtitle={
            <>
              <strong style={{ fontWeight: 700 }}>{editing.part.brand}</strong> {editing.part.name}
              <span style={{ color: 'var(--win-muted)' }}> · {categoryName(editing.category)}</span>
              {editing.kind === 'bike' && (
                <>
                  {' '}· <Link to={bikeHref(editing.ref)} style={{ color: 'var(--win-link)' }}>open bike</Link>
                </>
              )}
            </>
          }
          statusOptions={editing.kind === 'bin' ? BIN_STATUSES : STATUS_OPTIONS}
          initial={{
            status: editing.status,
            quantity: editing.quantity,
            tracking:
              editing.kind === 'bin' && editing.notes && !editing.tracking?.notes
                ? { ...editing.tracking, notes: editing.notes }
                : editing.tracking,
          }}
          hideQuantity={editing.kind === 'bike'}
          showInstalledAt={editing.kind === 'bike'}
          onSave={saveEdit}
        />
      )}
    </PageWindow>
  )
}
