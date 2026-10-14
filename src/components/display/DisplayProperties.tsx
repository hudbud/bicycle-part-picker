import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { create } from 'zustand'
import { Button, Checkbox, Frame, Window, WindowContent, WindowHeader } from 'react95'
import styled, { ThemeProvider } from 'styled-components'
import { Modal } from '@/components/ui/Modal'
import { useSettingsStore } from '@/store/settingsStore'
import { COLOR_SCHEMES, type ColorScheme, type SchemeGroup } from '@/theme/schemes'
import { schemeById, windowsTheme } from '@/theme/windowsTheme'

/** Open state for the one Display Properties dialog (opened from the toolbar or the desktop menu). */
export const useDisplayProperties = create<{ open: boolean; setOpen: (open: boolean) => void }>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

const GROUPS: { group: SchemeGroup; label: string }[] = [
  { group: 'Windows', label: 'Windows 95/98' },
  { group: 'Plus! 95', label: 'Plus! desktop themes' },
  { group: 'Plus! 98', label: 'Plus! 98' },
  { group: 'Plus! for Kids', label: 'Plus! for Kids' },
]

// ---------- preview ----------

const Desktop = styled.div`
  position: relative;
  height: 200px;
  overflow: hidden;
  background: var(--win-desktop);
`

const PreviewWindow = styled(Window)`
  position: absolute;
  padding: 2px;
  font-size: 12px;

  & > div:first-child { height: 22px; padding: 0 2px 0 4px; font-size: 12px; display: flex; align-items: center; justify-content: space-between; }
`

const TitleButton = styled(Button)`
  width: 18px;
  height: 16px;
  min-width: 0;
  padding: 0;
  font-size: 9px;
  pointer-events: none;
`

const MenuBar = styled.div`
  display: flex;
  gap: 2px;
  padding: 2px 2px 3px;
  color: var(--win-text);

  & span { padding: 1px 6px; }
  & .disabled { color: var(--win-gray-text); text-shadow: 1px 1px var(--win-hilight); }
  & .selected { background: var(--win-select); color: var(--win-select-text); }
`

const Title = ({ children, active = true }: { children: string; active?: boolean }) => (
  <WindowHeader active={active}>
    <span>{children}</span>
    <TitleButton tabIndex={-1} aria-hidden>✕</TitleButton>
  </WindowHeader>
)

/** The classic Appearance-tab preview: inactive window, active window with a menu, and a message box. */
function SchemePreview({ scheme, gradients }: { scheme: ColorScheme; gradients: boolean }) {
  const { theme, vars } = useMemo(() => windowsTheme(scheme, { gradients }), [scheme, gradients])
  return (
    <ThemeProvider theme={theme}>
      <Frame variant="field" style={{ display: 'block', padding: 2, width: '100%' }} aria-hidden>
        <Desktop style={vars as CSSProperties}>
          <PreviewWindow style={{ left: 10, top: 8, right: 40 }}>
            <Title active={false}>Inactive Window</Title>
          </PreviewWindow>
          <PreviewWindow style={{ left: 18, top: 34, right: 18 }}>
            <Title>Active Window</Title>
            <MenuBar>
              <span>Normal</span>
              <span className="disabled">Disabled</span>
              <span className="selected">Selected</span>
            </MenuBar>
            <WindowContent style={{ padding: 0 }}>
              <Frame variant="field" style={{ display: 'block', height: 72, padding: '4px 6px', background: theme.canvas, color: theme.canvasText }}>
                Window Text
              </Frame>
            </WindowContent>
          </PreviewWindow>
          <PreviewWindow style={{ left: 64, top: 128, width: 180 }}>
            <Title>Message Box</Title>
            <WindowContent style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: theme.materialText }}>
              <span>Message Text</span>
              <Button size="sm" tabIndex={-1} style={{ minWidth: 56, pointerEvents: 'none' }}>OK</Button>
            </WindowContent>
          </PreviewWindow>
        </Desktop>
      </Frame>
    </ThemeProvider>
  )
}

// ---------- scheme list ----------

const ListFrame = styled(Frame).attrs({ variant: 'field' })`
  display: block;
  width: 100%;
  height: 176px;
  overflow-y: auto;
  padding: 2px;
  background: var(--win-window);
  color: var(--win-window-text);
  font-size: 12px;

  &:focus-visible { outline: 1px dotted var(--win-window-text); outline-offset: -4px; }
`

const GroupHeading = styled.div`
  padding: 4px 4px 1px;
  font-weight: 700;
  color: var(--win-muted);
  &:first-child { padding-top: 1px; }
`

const Option = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 1px 4px 1px 10px;
  cursor: default;
  white-space: nowrap;

  &[aria-selected='true'] { background: var(--win-select); color: var(--win-select-text); }
`

/** Little face/title/desktop chips so the list is scannable without clicking every entry. */
const Swatch = ({ scheme }: { scheme: ColorScheme }) => (
  <span aria-hidden style={{ display: 'inline-flex', flexShrink: 0, border: '1px solid currentColor' }}>
    {[scheme.colors.Background, scheme.colors.ButtonFace, scheme.colors.ActiveTitle].map((c, i) => (
      <span key={i} style={{ width: 8, height: 10, background: c }} />
    ))}
  </span>
)

function SchemeList({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [value])

  const onKeyDown = (e: KeyboardEvent) => {
    const i = COLOR_SCHEMES.findIndex((s) => s.id === value)
    const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: COLOR_SCHEMES.length - 1, PageDown: i + 8, PageUp: i - 8 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onChange(COLOR_SCHEMES[Math.max(0, Math.min(COLOR_SCHEMES.length - 1, next))].id)
  }

  return (
    <ListFrame
      ref={ref}
      role="listbox"
      tabIndex={0}
      aria-labelledby="scheme-label"
      aria-activedescendant={`scheme-${value}`}
      onKeyDown={onKeyDown}
    >
      {GROUPS.map(({ group, label }) => (
        <div key={group} role="group" aria-label={label}>
          <GroupHeading role="presentation">{label}</GroupHeading>
          {COLOR_SCHEMES.filter((s) => s.group === group).map((s) => (
            <Option key={s.id} id={`scheme-${s.id}`} role="option" aria-selected={s.id === value} onClick={() => onChange(s.id)}>
              <Swatch scheme={s} />
              {s.name}
            </Option>
          ))}
        </div>
      ))}
    </ListFrame>
  )
}

// ---------- dialog ----------

export function DisplayPropertiesDialog() {
  const { open, setOpen } = useDisplayProperties()
  const colorScheme = useSettingsStore((s) => s.colorScheme)
  const titleGradients = useSettingsStore((s) => s.titleGradients)
  const setAppearance = useSettingsStore((s) => s.setAppearance)
  const [draft, setDraft] = useState({ colorScheme, titleGradients })

  // Start from the current settings each time the dialog opens.
  useEffect(() => {
    if (open) setDraft({ colorScheme, titleGradients })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const scheme = schemeById(draft.colorScheme)
  const changed = draft.colorScheme !== colorScheme || draft.titleGradients !== titleGradients
  const apply = () => setAppearance(draft)
  const close = () => setOpen(false)

  return (
    <Modal open={open} onClose={close} title="Display Properties" style={{ maxWidth: 420 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
        <SchemePreview scheme={scheme} gradients={draft.titleGradients} />
        <div>
          <div id="scheme-label" style={{ marginBottom: 4 }}>Scheme:</div>
          <SchemeList value={draft.colorScheme} onChange={(colorScheme) => setDraft((d) => ({ ...d, colorScheme }))} />
        </div>
        <Checkbox
          checked={draft.titleGradients}
          onChange={() => setDraft((d) => ({ ...d, titleGradients: !d.titleGradients }))}
          label="Gradient title bars (Windows 98)"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <Button onClick={() => { apply(); close() }} style={{ minWidth: 72 }}>OK</Button>
          <Button onClick={close} style={{ minWidth: 72 }}>Cancel</Button>
          <Button onClick={apply} disabled={!changed} style={{ minWidth: 72 }}>Apply</Button>
        </div>
      </div>
    </Modal>
  )
}
