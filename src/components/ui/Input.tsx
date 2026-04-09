import { forwardRef, type InputHTMLAttributes } from 'react'
import { TextInput } from 'react95'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Label = styled.label`
  font-size: 12px;
  font-weight: 700;
`

const ErrorText = styled.p`
  font-size: 11px;
  color: #c0392b;
`

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, style, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <Wrapper>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <TextInput
          ref={ref}
          id={inputId}
          fullWidth
          style={style}
          {...(props as any)}
        />
        {error && <ErrorText>{error}</ErrorText>}
      </Wrapper>
    )
  },
)

Input.displayName = 'Input'
