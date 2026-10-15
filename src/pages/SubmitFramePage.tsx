import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { WindowHeader, WindowContent, Button, Checkbox } from 'react95'
import type { Part, WheelSize } from '@/types/parts'
import { getPartById, getPartsByCategory } from '@/data/partsDatabase'
import { productPath } from '@/data/categoryConfig'
import {
  BB_SHELLS, BRAKE_MOUNTS, EMPTY_DRAFT, FD_MOUNTS, HEADSETS, MATERIALS, REAR_AXLES, SHOCK_MOUNTS,
  STEERERS, SUSPENSIONS, WHEEL_SIZES, SUBMISSION_REPO, canUseOnBike, draftId, draftProblems, draftToPart, isDisc,
  frameNameKey, isFull, isVintageYear, partToDraft, slugify, submissionBody, submissionIssueUrl, submissionTitle,
  type DraftField, type FrameDraft, type YesNo,
} from '@/data/frameSubmission'
import { useCustomPartsStore } from '@/store/customPartsStore'
import { useAddToBuild } from '@/components/products/useAddToBuild'
import { FieldInput, FieldLabel, FieldSelect, FieldTextarea } from '@/components/tracking/fields'
import { Box, Muted, PageWindow, Strong, TextLink } from '@/components/products/ProductBits'
import { useToast } from '@/hooks/useToast'
import { useIsMobile } from '@/hooks/useMediaQuery'

const Intro = styled.p`
  font-size: 12px;
  line-height: 1.45;
  margin: 0 0 10px;
  max-width: 760px;
`

const Sections = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
  @media (max-width: 760px) { grid-template-columns: minmax(0, 1fr); }
`

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px 10px;
  & > .wide { grid-column: 1 / -1; }
  [aria-invalid='true'] { outline: 1px solid var(--win-bad); outline-offset: 1px; }
`

const ErrorText = styled.span`
  font-weight: 400;
  color: var(--win-bad);
`

const Checks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0 12px;
  font-weight: 400;
  label { margin: 0; font-size: 12px; }
`

const Notice = styled.div`
  margin: 0 0 10px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.45;
  background: var(--win-info);
  color: var(--win-info-text);
  border: 1px solid var(--win-shadow);
  a { color: inherit; }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  margin-top: 12px;
`

type Opts<T> = readonly { value: T; label: string }[]

/** GitHub caps prefilled issue URLs at roughly 8k characters. */
const MAX_ISSUE_URL = 8000

function initialDraft(params: URLSearchParams, custom: Part[]): { draft: FrameDraft; original?: Part } {
  const edit = params.get('edit')
  const original = edit ? getPartById(edit) : undefined
  if (original?.category === 'frame') return { draft: partToDraft(original), original }
  const from = params.get('from')
  const customPart = from ? custom.find((p) => p.id === from && p.category === 'frame') : undefined
  if (customPart) return { draft: partToDraft(customPart) }
  return { draft: { ...EMPTY_DRAFT, ...splitBrand(params.get('brand') ?? '', params.get('name') ?? '') } }
}

/** A search like "mash all road" → brand "MASH" (as the catalog spells it) + model "all road". */
function splitBrand(brand: string, name: string): { brand: string; model: string } {
  name = name.trim()
  if (brand.trim() || !name.includes(' ')) return { brand: brand.trim(), model: name }
  const lower = name.toLowerCase()
  const known = [...new Set(getPartsByCategory('frame').map((p) => p.brand))]
    .sort((a, b) => b.length - a.length)
    .find((b) => lower.startsWith(b.toLowerCase() + ' '))
  const cut = known ? known.length : name.indexOf(' ')
  return { brand: known ?? name.slice(0, cut), model: name.slice(cut).trim() }
}

export function SubmitFramePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const mobile = useIsMobile()
  const { success, error, info } = useToast()
  const addToBuild = useAddToBuild()
  const customParts = useCustomPartsStore((s) => s.parts)
  const addCustomPart = useCustomPartsStore((s) => s.addPart)

  const [{ draft: start, original }] = useState(() => initialDraft(params, customParts))
  const [d, setDraft] = useState<FrameDraft>(start)
  const [showErrors, setShowErrors] = useState(false)
  const [sent, setSent] = useState(false)
  const editOf = original?.id

  const set = <K extends DraftField>(k: K, v: FrameDraft[K]) => setDraft((x) => ({ ...x, [k]: v }))
  const toggleWheel = (v: WheelSize) =>
    setDraft((x) => ({ ...x, wheelSizes: x.wheelSizes.includes(v) ? x.wheelSizes.filter((y) => y !== v) : [...x.wheelSizes, v] }))

  const problems = useMemo(() => draftProblems(d), [d])
  const nProblems = Object.keys(problems).length
  const vintage = isVintageYear(d)

  // Frames already in the catalog that look like this one (same brand, overlapping model name).
  const similar = useMemo(() => {
    const brand = d.brand.trim().toLowerCase()
    const model = slugify(d.model).replace(/-frame(set)?$/, '')
    if (editOf || !brand || model.length < 2) return []
    return getPartsByCategory('frame')
      .filter((p) => p.brand.toLowerCase() === brand && (slugify(p.name).includes(model) || model.includes(slugify(p.name).replace(/-frame(set)?$/, ''))))
      .slice(0, 4)
  }, [d.brand, d.model, editOf])
  // The same frame under the importer's id or brand + model; submitting it would be rejected.
  const duplicate = useMemo(() => {
    if (editOf || !d.brand.trim() || !d.model.trim()) return undefined
    const key = frameNameKey(d.brand, d.model)
    return getPartById(draftId(d)) ?? getPartsByCategory('frame').find((p) => frameNameKey(p.brand, p.name) === key)
  }, [d, editOf])
  const idTaken = !!duplicate

  const invalid = (k: DraftField) => showErrors && !!problems[k]
  /** Props tying a control to its field's label, error and hint. */
  const ctl = (k: DraftField) => ({
    id: `in-${k}`,
    'aria-invalid': invalid(k),
    'aria-describedby': [invalid(k) && `e-${k}`, `h-${k}`].filter(Boolean).join(' '),
  })

  // `group` fields hold their own checkbox labels, so their title is a plain span.
  const field = (k: DraftField, label: ReactNode, control: ReactNode, opts: { hint?: string; wide?: boolean; group?: boolean } = {}) => (
    <FieldLabel
      as="div"
      role={opts.group ? 'group' : undefined}
      aria-labelledby={opts.group ? `l-${k}` : undefined}
      className={opts.wide ? 'wide' : undefined}
      data-field={k}
    >
      {opts.group ? <span id={`l-${k}`}>{label}</span> : <label htmlFor={`in-${k}`}>{label}</label>}
      {control}
      {invalid(k) && <ErrorText id={`e-${k}`}>{problems[k]}</ErrorText>}
      {opts.hint && <span className="hint" id={`h-${k}`}>{opts.hint}</span>}
    </FieldLabel>
  )
  const text = (k: DraftField, label: ReactNode, o: { hint?: string; wide?: boolean; placeholder?: string; numeric?: boolean } = {}) =>
    field(k, label, (
      <FieldInput
        {...ctl(k)}
        value={d[k] as string}
        onChange={(e) => set(k, e.target.value as FrameDraft[typeof k])}
        placeholder={o.placeholder}
        inputMode={o.numeric ? 'decimal' : undefined}
      />
    ), o)
  const select = <T extends string>(k: DraftField, label: ReactNode, options: Opts<T>, o: { hint?: string } = {}) =>
    field(k, label, (
      <FieldSelect {...ctl(k)} value={d[k] as string} onChange={(e) => set(k, e.target.value as FrameDraft[typeof k])}>
        <option value="">—</option>
        {options.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
      </FieldSelect>
    ), o)
  const yesNo = (k: DraftField, label: ReactNode, o: { hint?: string } = {}) =>
    select<Exclude<YesNo, ''>>(k, label, [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], o)

  const part = useMemo(() => draftToPart(d), [d])
  const title = submissionTitle(part, editOf)
  const body = () => submissionBody(part, editOf, original)

  const useOnBike = () => {
    const custom: Part = { ...part, id: `custom-${crypto.randomUUID()}`, tags: ['Custom'], isCustom: true }
    addCustomPart(custom)
    addToBuild('frame', custom)
  }

  const submit = () => {
    if (nProblems > 0 || idTaken) {
      setShowErrors(true)
      error(idTaken ? 'That frame is already in the catalog' : `${nProblems} field${nProblems === 1 ? '' : 's'} still need${nProblems === 1 ? 's' : ''} an answer`)
      const first = Object.keys(problems)[0]
      if (first) document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    const full = body()
    let url = submissionIssueUrl(title, full)
    if (url.length > MAX_ISSUE_URL) {
      void navigator.clipboard?.writeText(full)
      url = submissionIssueUrl(title, '(Paste the submission you copied from the site here.)')
      info('Submission copied — paste it into the GitHub issue')
    }
    window.open(url, '_blank', 'noopener')
    setSent(true)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${body()}`)
      success('Submission copied to clipboard')
    } catch {
      error('Couldn’t copy — your browser blocked clipboard access')
    }
  }

  const full = isFull(d)

  return (
    <PageWindow>
      <WindowHeader active>
        <span>{original ? `Suggest a correction — ${original.brand} ${original.name}` : 'Add a frame to the catalog'}</span>
      </WindowHeader>
      <WindowContent style={{ padding: mobile ? 8 : 12 }}>
        {original ? (
          <Intro>
            Fix anything that&rsquo;s wrong or missing below. Your change goes to the maintainers as a GitHub issue, with the
            fields you changed marked. Link a source if you can (spec sheet, catalog scan, archived product page).
          </Intro>
        ) : (
          <Intro>
            Missing a frame? Fill in what you know. <Strong>Use on my bike</Strong> saves it to your build right away (only brand
            and model are needed). <Strong>Submit to catalog</Strong> sends it to the maintainers as a GitHub issue so everyone
            gets it. That needs every standard filled in, because compatibility checks depend on them. A bot checks each
            submission within a minute.
          </Intro>
        )}

        {sent && (
          <Notice role="status">
            <Strong>Almost done:</Strong> finish it in the GitHub tab that just opened and press <em>Create</em> (you need a free
            GitHub account). A bot comments when the submission checks out. Once a maintainer merges it, the frame shows up here for everyone.
            {' '}No tab? <a href={`https://github.com/${SUBMISSION_REPO}/issues?q=is%3Aissue+%5BFrame%5D`} target="_blank" rel="noreferrer">See frame submissions</a> or use <em>Copy submission</em>.
          </Notice>
        )}

        {(similar.length > 0 || idTaken) && (
          <Notice>
            <Strong>{idTaken ? 'This frame is already in the catalog:' : 'Already in the catalog?'}</Strong>{' '}
            {similar.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ' · '}
                <Link to={productPath(p.id)}>{p.brand} {p.name}{p.year ? ` (${p.year})` : ''}</Link>{' '}
                (<Link to={`/submit/frame?edit=${encodeURIComponent(p.id)}`}>correct it</Link>)
              </span>
            ))}
            {duplicate && !similar.includes(duplicate) && (
              <><Link to={productPath(duplicate.id)}>{duplicate.brand} {duplicate.name}</Link> (<Link to={`/submit/frame?edit=${encodeURIComponent(duplicate.id)}`}>correct it</Link>)</>
            )}
            {idTaken && <> — if yours is a different version, add the version or year to the model name.</>}
          </Notice>
        )}

        <Sections>
          <Box label="Frame">
            <Fields>
              {text('brand', 'Brand', { placeholder: 'MASH' })}
              {text('model', 'Model', { placeholder: 'All Road Frameset' })}
              {text('year', 'Model year', { placeholder: '2024', numeric: true })}
              {select('material', 'Material', MATERIALS)}
              {text('price', vintage || d.discontinued ? 'Used value (USD)' : 'MSRP (USD)', {
                numeric: true, placeholder: vintage || d.discontinued ? '400' : '1500', hint: 'Frame or frameset',
              })}
              {field('weightG', 'Frame weight (g)', (
                <>
                  <FieldInput {...ctl('weightG')} value={d.weightG} onChange={(e) => set('weightG', e.target.value)} inputMode="numeric" placeholder="1900" />
                  <Checks><Checkbox checked={d.weightEstimated} onChange={() => set('weightEstimated', !d.weightEstimated)} label="Estimate" /></Checks>
                </>
              ))}
              {field('discontinued', 'Availability', (
                <Checks>
                  <Checkbox
                    checked={vintage || d.discontinued}
                    disabled={vintage}
                    onChange={() => set('discontinued', !d.discontinued)}
                    label="No longer made"
                  />
                </Checks>
              ), { group: true, hint: vintage ? 'Pre-2005: priced as used' : undefined })}
              {text('tubing', 'Tubing', { placeholder: 'Columbus Zona' })}
              {text('url', 'Link', { wide: true, placeholder: 'https://… product page, spec sheet or archived catalog' })}
            </Fields>
          </Box>

          <Box label="Fit">
            <Fields>
              {field('wheelSizes', 'Wheel sizes', (
                <Checks>
                  {WHEEL_SIZES.map((o) => <Checkbox key={o.value} checked={d.wheelSizes.includes(o.value)} onChange={() => toggleWheel(o.value)} label={o.label} />)}
                </Checks>
              ), { wide: true, group: true })}
              {text('maxTireMm', 'Max tire (mm)', { numeric: true, placeholder: '45', hint: 'Widest tire, main wheel size' })}
              {select('suspension', 'Suspension', SUSPENSIONS)}
              {text('maxForkTravelMm', 'Max fork travel (mm)', { numeric: true, placeholder: d.suspension === 'Rigid' ? '0' : '120', hint: d.suspension === 'Rigid' ? 'Blank = rigid fork only' : undefined })}
              {full && text('travelMm', 'Rear travel (mm)', { numeric: true, placeholder: '130' })}
              {full && text('shockSize', 'Shock size', { placeholder: '210x55', hint: 'Eye-to-eye × stroke' })}
              {full && select('shockMount', 'Shock mount', SHOCK_MOUNTS)}
            </Fields>
          </Box>

          <Box label="Standards">
            <Fields>
              {select('bbShell', 'BB shell', BB_SHELLS)}
              {select('rearAxle', 'Rear axle', REAR_AXLES)}
              {select('brakeMount', 'Rear brake mount', BRAKE_MOUNTS)}
              {isDisc(d.brakeMount) && text('maxRotorMm', 'Max rear rotor (mm)', { numeric: true, placeholder: '160' })}
              {select('headsetStd', 'Headset', HEADSETS)}
              {select('steerer', 'Steerer it takes', STEERERS)}
              {text('seatpostMm', 'Seatpost Ø (mm)', { numeric: true, placeholder: '27.2' })}
              {yesNo('derailleurHanger', 'Derailleur hanger', { hint: 'No = single-speed/track only' })}
              {yesNo('udh', 'SRAM UDH')}
              {select('frontDerailleurMount', 'Front derailleur', FD_MOUNTS)}
              {yesNo('downtubeBosses', 'Downtube shifter bosses', { hint: 'Optional' })}
            </Fields>
          </Box>

          <Box label="Notes">
            <Fields>
              {field('notes', 'Anything else', (
                <FieldTextarea
                  {...ctl('notes')}
                  value={d.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={4}
                  placeholder="Sizes, dropouts, rack/fender mounts, where it was made, quirks…"
                  style={{ fontWeight: 400 }}
                />
              ), { wide: true })}
              {text('submittedBy', 'Your Reddit username', { placeholder: 'u/…', hint: 'Optional, shown as the submitter' })}
            </Fields>
          </Box>
        </Sections>

        <Actions>
          {!original && (
            <Button onClick={useOnBike} disabled={!canUseOnBike(d)} title={canUseOnBike(d) ? undefined : 'Enter at least a brand and model'}>
              Use on my bike
            </Button>
          )}
          <Button primary onClick={submit} style={{ fontWeight: 700 }}>
            {original ? 'Send correction…' : 'Submit to catalog…'}
          </Button>
          <Button onClick={copy} disabled={!canUseOnBike(d)}>Copy submission</Button>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Muted style={{ flex: '1 1 240px' }}>
            {nProblems === 0
              ? 'Ready to submit.'
              : `${nProblems} field${nProblems === 1 ? '' : 's'} left before it can go to the catalog.`}
            {' '}Submissions are public GitHub issues. <TextLink to="/about#community-frames">How it works</TextLink>
          </Muted>
        </Actions>
      </WindowContent>
    </PageWindow>
  )
}
