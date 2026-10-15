import { useMemo, useRef, useState } from 'react'
import { Checkbox, Tabs, Tab, TabBody, TextInput } from 'react95'
import styled from 'styled-components'
import type { Build } from '@/types/build'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useBikeLink, useCopyText } from '@/hooks/useBuildShare'
import { localOnlyCount, publicPhotos } from '@/utils/bikePhotos'
import { useAccountStore } from '@/account/accountStore'
import { useSettingsStore } from '@/store/settingsStore'
import {
  DEFAULT_POST_OPTIONS, POST_FORMATS, generatePost, suggestTitle, type PostFormat, type PostOptions,
} from '@/components/build/buildMarkup'

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`

const Label = styled.div`
  font-size: 11px;
  font-weight: 700;
`

const Row = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;

  & > .grow { flex: 1 1 240px; min-width: 0; }
`

/** react95’s TextInput puts `style` on its wrapper, so size the field itself here. */
const Field = styled(TextInput)`
  input { font-size: 12px; }
`

const Preview = styled(TextInput)`
  textarea { font-family: monospace; font-size: 12px; line-height: 1.35; }
`

const Hint = styled.p`
  font-size: 11px;
  color: var(--win-muted);
  margin: 0;
`

const Options = styled.fieldset`
  display: flex;
  flex-wrap: wrap;
  gap: 0 14px;
  border: none;
  margin: 0 0 8px;
  padding: 0;

  & > legend { font-size: 11px; font-weight: 700; padding: 0; margin-bottom: 2px; }
  label { font-size: 12px; }
`

type Toggle = 'link' | 'notes' | 'weights' | 'pricesPaid' | 'condition' | 'odometer' | 'totals'

const TOGGLES: { id: Toggle; label: string }[] = [
  { id: 'link', label: 'Bike link' },
  { id: 'notes', label: 'Notes' },
  { id: 'weights', label: 'Weights' },
  { id: 'pricesPaid', label: 'Prices paid' },
  { id: 'condition', label: 'Condition' },
  { id: 'odometer', label: 'Odometer' },
  { id: 'totals', label: 'Totals' },
]

const FORMAT_HINTS: Record<PostFormat, string> = {
  markdown: 'In Reddit’s Markdown editor paste the Markdown; in the fancy editor paste Plain text.',
  plain: 'For Reddit’s fancy (rich text) editor, Instagram captions, chat and email.',
  bbcode: 'For most bike forums (phpBB, vBulletin, XenForo).',
}

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  build: Build
}

/**
 * Share a bike: the public `/bike#…` link, a suggested r/xbiking post title, and the parts
 * list as Reddit Markdown, plain text or BBCode. One set of checkboxes drives both the link
 * payload and the text, so the post never shows more than the link page does.
 */
export function ShareDialog({ open, onClose, build }: ShareDialogProps) {
  // Options and tab survive closing; the body (and its link encoding) only runs while open.
  const [format, setFormat] = useState<PostFormat>('markdown')
  const [on, setOn] = useState<Record<Toggle, boolean>>({ ...DEFAULT_POST_OPTIONS, link: true })
  return (
    <Modal open={open} onClose={onClose} title="Share / Post to Reddit" style={{ maxWidth: 760 }}>
      <ShareBody build={build} onClose={onClose} format={format} setFormat={setFormat} on={on} setOn={setOn} />
    </Modal>
  )
}

interface ShareBodyProps {
  build: Build
  onClose: () => void
  format: PostFormat
  setFormat: (f: PostFormat) => void
  on: Record<Toggle, boolean>
  setOn: React.Dispatch<React.SetStateAction<Record<Toggle, boolean>>>
}

function ShareBody({ build, onClose, format, setFormat, on, setOn }: ShareBodyProps) {
  const isMobile = useIsMobile()
  const distanceUnit = useSettingsStore((s) => s.distanceUnit)
  const copy = useCopyText()
  const linkRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  // Only offer what this bike actually has.
  const has = useMemo(() => {
    const t = build.components.filter((s) => s.part).map((s) => s.tracking)
    return {
      notes: t.some((x) => x?.notes?.trim()) || (build.additionalItems ?? []).some((x) => x.notes?.trim()),
      pricesPaid: t.some((x) => x?.pricePaid != null),
      condition: t.some((x) => x?.condition),
      odometer: !!build.odometerKm,
    }
  }, [build])
  const opt = (k: keyof typeof has) => on[k] && has[k]

  const link = useBikeLink(build, { notes: opt('notes'), pricesPaid: opt('pricesPaid'), condition: opt('condition'), odometer: opt('odometer') })

  const [title, setTitle] = useState(() => suggestTitle(build))

  const postOpts: PostOptions = {
    link: on.link && link ? link : undefined,
    weights: on.weights,
    pricesPaid: opt('pricesPaid'),
    notes: opt('notes'),
    condition: opt('condition'),
    odometer: opt('odometer'),
    totals: on.totals,
    distanceUnit,
  }
  const text = generatePost(build, format, postOpts)
  const linked = publicPhotos(build).length
  const deviceOnly = localOnlyCount(build)
  const accounts = useAccountStore((s) => s.available)
  const signedIn = useAccountStore((s) => !!s.user)

  return (
    <>
      <Section>
        <Label as="label" htmlFor="share-link">Bike link</Label>
        <Row>
          <Field
            id="share-link"
            ref={linkRef}
            className="grow"
            readOnly
            value={link || 'Making link…'}
            onFocus={(e) => e.target.select()}
          />
          <Button size="sm" disabled={!link} onClick={() => copy(link, 'Bike link copied!', linkRef.current)}>Copy</Button>
          <Button size="sm" variant="secondary" disabled={!link} onClick={() => window.open(link, '_blank', 'noopener')}>Open</Button>
        </Row>
        <Hint>
          A read-only page with {linked ? `${linked} photo${linked === 1 ? '' : 's'}, ` : ''}the parts and your notes — anyone can open it, no account needed.
          {deviceOnly > 0 && (signedIn
            ? ` ${deviceOnly} photo${deviceOnly === 1 ? ' is' : 's are'} still uploading to your account and will be in the link once ${deviceOnly === 1 ? 'it’s' : 'they’re'} done.`
            : ` ${deviceOnly} uploaded photo${deviceOnly === 1 ? ' stays' : 's stay'} on this device; ${accounts ? 'sign in to include them, or ' : ''}add ${deviceOnly === 1 ? 'it' : 'them'} as Imgur or Reddit links on the bike page${accounts ? '' : ` to include ${deviceOnly === 1 ? 'it' : 'them'}`}.`)}
        </Hint>
      </Section>

      <Section>
        <Label as="label" htmlFor="share-title">Suggested post title</Label>
        <Row>
          <Field
            id="share-title"
            ref={titleRef}
            className="grow"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button size="sm" disabled={!title.trim()} onClick={() => copy(title.trim(), 'Title copied!', titleRef.current)}>Copy</Button>
        </Row>
      </Section>

      <Options>
        <legend>Include</legend>
        {TOGGLES.map((t) => {
          const unavailable = t.id in has && !has[t.id as keyof typeof has]
          return (
            <Checkbox
              key={t.id}
              label={t.label}
              checked={on[t.id] && !unavailable}
              disabled={unavailable}
              title={unavailable ? `This bike has no ${t.label.toLowerCase()} recorded` : undefined}
              onChange={() => setOn((o) => ({ ...o, [t.id]: !o[t.id] }))}
            />
          )
        })}
      </Options>

      <Tabs value={format} onChange={(v: PostFormat) => setFormat(v)}>
        {POST_FORMATS.map((f) => (
          <Tab key={f.id} value={f.id}>{isMobile && f.id === 'markdown' ? 'Markdown' : f.label}</Tab>
        ))}
      </Tabs>
      <TabBody>
        <Hint style={{ marginBottom: 6 }}>{FORMAT_HINTS[format]}</Hint>
        <Preview
          ref={textRef}
          multiline
          readOnly
          value={text}
          rows={isMobile ? 12 : 16}
          fullWidth
          onFocus={(e) => e.target.select()}
          aria-label="Post text preview"
        />
        <Row style={{ marginTop: 8, justifyContent: 'space-between' }}>
          <Hint style={{ flex: '1 1 220px' }}>Serial numbers, sources and your service log are never included.</Hint>
          <span style={{ display: 'flex', gap: 6 }}>
            <Button size="sm" onClick={() => copy(text, 'Post text copied!', textRef.current)}>Copy text</Button>
            <Button size="sm" variant="secondary" onClick={onClose}>Close</Button>
          </span>
        </Row>
      </TabBody>
    </>
  )
}
