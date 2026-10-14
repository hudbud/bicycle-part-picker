import { useDeferredValue, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Window, WindowHeader, WindowContent, Button } from 'react95'
import { useGarageStore } from '@/store/garageStore'
import { useToast } from '@/hooks/useToast'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { computeCompat } from '@/hooks/useCompat'
import { decodeBikeLink, decodeSharedBuild } from '@/utils/buildCodec'
import { findAppLink, parsePartsList, suggestBikeName } from '@/utils/importParts'
import { FieldInput, FieldLabel, FieldTextarea } from '@/components/tracking/fields'
import { CompatBanner } from '@/components/build/CompatBanner'
import { BuildIssues } from '@/components/build/BuildIssues'
import { PartSelectionModal } from '@/components/parts/PartSelectionModal'
import { ReviewTable } from '@/components/import/ReviewTable'
import {
  CUSTOM, categoryName, pickPart, rowsFromBuild, rowsFromParsed, rowsToBuild,
  type ImportMeta, type ReviewRow,
} from '@/components/import/reviewRows'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
`

const Steps = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: 2px 14px;
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: var(--win-muted);
  li[aria-current='step'] { color: var(--win-text); font-weight: 700; }
`

const Intro = styled.p`
  font-size: 12px;
  line-height: 1.45;
  margin: 0 0 10px;
  max-width: 720px;
`

const Fields = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 6px 10px;
  margin-bottom: 10px;
`

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  margin-top: 10px;
`

const Muted = styled.span`
  font-size: 11px;
  color: var(--win-muted);
  line-height: 1.4;
`

const Notice = styled.div`
  margin-top: 8px;
  padding: 6px 8px;
  font-size: 12px;
  background: var(--win-info);
  color: var(--win-info-text);
  border: 1px solid var(--win-shadow);
`

const PLACEHOLDER = `Frame: 1992 Bridgestone XO-1 (58cm)
Fork: stock
Bars: Nitto Albatross
Stem: Nitto Technomic
Shifters: Rivendell Silver thumbies
RD: Deore XT M730
Cranks: Sugino XD2 46/36
Wheels: XT M730 hubs laced to Araya RM-20s
Tires: Schwalbe Kojak 26x1.35
Brakes: Shimano R650 long reach / XT M730 levers
Saddle: Brooks B17
Pedals: MKS Sylvan`

const EXAMPLE = `Frame: 1992 Bridgestone XO-1 (58cm, paid $450)
Fork: stock
Headset: Tange Levin
Bars: Nitto Albatross
Stem - Nitto Technomic
* Shifters: Rivendell Silver thumbies
- RD: Deore XT M730
Cranks: Sugino XD2 46/36
BB: Shimano UN55 68x113
Wheels: XT M730 hubs laced to Araya RM-20s
Tyres: Schwalbe Kojak 26x1.35 ($60)
Brakes: Shimano R650 long reach / XT M730 levers
Saddle: Brooks B17 (used, good)
Post: Nitto S65
Pedals: MKS Sylvan with half clips
Rack: Nitto M12`

type Step = 'paste' | 'review'

interface Review { rows: ReviewRow[]; meta: ImportMeta; odometerKm?: number; fromLink?: boolean }

export function ImportBikePage() {
  const navigate = useNavigate()
  const saveBuild = useGarageStore((s) => s.saveBuild)
  const { success, error } = useToast()
  const mobile = useMediaQuery('(max-width: 767px)')

  const [step, setStep] = useState<Step>('paste')
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [review, setReview] = useState<Review>({ rows: [], meta: { frameNotes: [], photoUrls: [] } })
  const [searching, setSearching] = useState<ReviewRow | undefined>()
  const [showIssues, setShowIssues] = useState(false)
  const [busy, setBusy] = useState(false)

  const link = useMemo(() => findAppLink(text), [text])
  // Live name suggestion while typing (the parse is cheap, but not per keystroke).
  const deferred = useDeferredValue(text)
  const parsed = useMemo(() => (link ? [] : parsePartsList(deferred)), [deferred, link])
  const suggestedName = useMemo(() => suggestBikeName(parsed), [parsed])
  const bikeName = nameTouched ? name : suggestedName

  const build = useMemo(
    () => ({ ...rowsToBuild(review.rows, review.meta, { name: bikeName }), ...(review.odometerKm ? { odometerKm: review.odometerKm } : {}) }),
    [review, bikeName],
  )
  const compat = useMemo(() => computeCompat(build), [build])
  const nIssues = compat.errors.length + compat.warnings.length

  const counts = useMemo(() => {
    const c = { parts: 0, high: 0, check: 0, custom: 0, extra: 0, off: 0 }
    for (const r of review.rows) {
      if (!r.include) { c.off++; continue }
      if (!r.category) { c.extra++; continue }
      c.parts++
      if (r.choice === CUSTOM) c.custom++
      else if (r.confidence === 'high') c.high++
      else c.check++
    }
    return c
  }, [review.rows])

  const toReview = async () => {
    if (link) {
      setBusy(true)
      const decoded = link.kind === 'bike' ? await decodeBikeLink(link.code) : decodeSharedBuild(link.code)
      setBusy(false)
      if (!decoded) { error('That link didn’t open — it may be cut off. Paste the whole link, or the parts list.'); return }
      const { rows, meta } = rowsFromBuild(decoded)
      setReview({ rows, meta, odometerKm: decoded.odometerKm, fromLink: true })
      if (!nameTouched) { setName(decoded.name); setNameTouched(true) }
    } else {
      const { rows, meta } = rowsFromParsed(parsePartsList(text))
      if (!rows.length) { error('No parts found. Put one part per line, like “Frame: Surly Cross-Check”.'); return }
      setReview({ rows, meta })
    }
    setStep('review')
    window.scrollTo(0, 0)
  }

  const updateRow = (row: ReviewRow) => setReview((r) => ({ ...r, rows: r.rows.map((x) => (x.id === row.id ? row : x)) }))

  const add = () => {
    const saved = saveBuild(build)
    success(`Added “${saved.name}” to your Garage`)
    navigate(`/garage/${saved.id}`)
  }

  const nameField = (
    <FieldLabel style={{ flex: '1 1 260px', maxWidth: 420 }}>
      Bike name
      <FieldInput
        value={bikeName}
        placeholder="Filled in from the Frame line"
        onChange={(e) => { setName(e.target.value); setNameTouched(true) }}
      />
    </FieldLabel>
  )
  return (
    <PageWindow>
      <WindowHeader active><span>Add a bike — paste a parts list</span></WindowHeader>
      <WindowContent style={{ padding: mobile ? 8 : 12 }}>
        <Steps aria-label="Steps">
          <li aria-current={step === 'paste' ? 'step' : undefined}>1. Paste</li>
          <li aria-current={step === 'review' ? 'step' : undefined}>2. Check the matches</li>
          <li>3. Add to Garage</li>
        </Steps>

        {step === 'paste' ? (
          <>
            <Intro>
              Paste the parts list from a Reddit post, a forum thread, a spreadsheet or your notes — one part per line.
              Labels like <code>Frame:</code> or <code>RD -</code> help but aren&rsquo;t required. A shared build or
              bike link from this site works too.
            </Intro>
            <Fields>{nameField}</Fields>
            <FieldLabel>
              Parts list
              <FieldTextarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={mobile ? 12 : 16}
                spellCheck={false}
                style={{ width: '100%', fontFamily: "'Courier New', monospace", fontSize: 12, fontWeight: 400 }}
              />
            </FieldLabel>
            {link && (
              <Notice>
                That&rsquo;s a {link.kind === 'bike' ? 'bike' : 'shared build'} link from this site — its parts come in exactly as listed.
              </Notice>
            )}
            <Row>
              <Button primary onClick={toReview} disabled={!text.trim() || busy} style={{ fontWeight: 700 }}>
                {link ? 'Open link →' : 'Review parts →'}
              </Button>
              {!text.trim() && <Button onClick={() => setText(EXAMPLE)}>Try an example</Button>}
              <Button onClick={() => navigate('/garage')}>Cancel</Button>
            </Row>
            <Row>
              <Muted>
                Nothing leaves your browser. No list handy? <Link to="/build" style={{ color: 'var(--win-link)' }}>Start from a frame</Link> or
                copy a <Link to="/guides" style={{ color: 'var(--win-link)' }}>guide</Link> or <Link to="/builds" style={{ color: 'var(--win-link)' }}>community build</Link>.
              </Muted>
            </Row>
          </>
        ) : (
          <>
            <Fields>
              {nameField}
              <Button size="sm" onClick={() => setStep('paste')} style={{ height: 24 }}>← Edit list</Button>
            </Fields>
            <div style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.45 }}>
              <strong>{counts.parts}</strong> part{counts.parts === 1 ? '' : 's'}: {counts.high} matched
              {counts.check > 0 && <>, <strong>{counts.check} to check</strong></>}
              {counts.custom > 0 && <>, {counts.custom} custom</>}
              {counts.extra > 0 && <> · {counts.extra} extra item{counts.extra === 1 ? '' : 's'}</>}
              {counts.off > 0 && <> · {counts.off} left out</>}
              <br />
              <Muted>
                Pick the right part where it says Check or Guess. Anything not in the catalog is saved as a custom part,
                and a second part for the same slot goes under additional items.
              </Muted>
            </div>

            <ReviewTable rows={review.rows} onChange={updateRow} onSearch={setSearching} mobile={mobile} />

            <div style={{ marginTop: 10 }}>
              <CompatBanner build={build} compat={compat} />
              {nIssues > 0 && (
                <Button size="sm" onClick={() => setShowIssues((v) => !v)} style={{ marginTop: 4, height: 22, fontSize: 11 }}>
                  {showIssues ? 'Hide' : 'Show'} compatibility notes ({nIssues})
                </Button>
              )}
              {showIssues && <BuildIssues compat={compat} />}
            </div>

            <Row>
              <Button primary onClick={add} disabled={counts.parts + counts.extra === 0} style={{ fontWeight: 700 }}>
                Add to Garage
              </Button>
              <Button onClick={() => navigate('/garage')}>Cancel</Button>
              <Muted style={{ flex: '1 1 240px' }}>
                Parts are saved as Owned, with sizes and asides in their notes. You can change anything on the bike&rsquo;s page.
              </Muted>
            </Row>
          </>
        )}
      </WindowContent>

      {searching?.category && (
        <PartSelectionModal
          open
          onClose={() => setSearching(undefined)}
          category={searching.category}
          categoryLabel={categoryName(searching.category)}
          onSelect={(part) => {
            updateRow(pickPart(searching, part))
            setSearching(undefined)
          }}
        />
      )}
    </PageWindow>
  )
}
