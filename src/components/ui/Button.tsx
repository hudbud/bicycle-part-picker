import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Button as R95Button } from 'react95'
import styled from 'styled-components'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const DangerButton = styled(R95Button)`
  background: #c0392b;
  color: white;
  &:hover:not(:disabled) {
    background: #a93226;
  }
`

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size: _size, fullWidth, className, children, ...props }, ref) => {
    const r95Variant = variant === 'primary' ? 'raised' : 'flat'

    if (variant === 'danger') {
      return (
        <DangerButton ref={ref} fullWidth={fullWidth} className={className} {...props}>
          {children}
        </DangerButton>
      )
    }

    return (
      <R95Button
        ref={ref}
        variant={r95Variant}
        fullWidth={fullWidth}
        className={className}
        {...props}
      >
        {children}
      </R95Button>
    )
  },
)

Button.displayName = 'Button'
