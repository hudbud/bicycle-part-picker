import { useEffect, useRef, type ReactNode } from 'react'
import { MenuList } from 'react95'
import styled from 'styled-components'

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`

const FloatingMenu = styled(MenuList)`
  position: absolute;
  z-index: 40;
  top: 100%;
  left: 0;
  min-width: 144px;
  margin-top: 2px;
`

interface PopoverProps {
  open: boolean
  onClose: () => void
  trigger: ReactNode
  children: ReactNode
  className?: string
}

export function Popover({ open, onClose, trigger, children, className }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <Wrapper ref={ref}>
      {trigger}
      {open && (
        <FloatingMenu className={className}>
          {children}
        </FloatingMenu>
      )}
    </Wrapper>
  )
}
