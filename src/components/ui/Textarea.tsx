import { forwardRef, type TextareaHTMLAttributes } from 'react'
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

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, style, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <Wrapper>
        {label && <Label htmlFor={textareaId}>{label}</Label>}
        <TextInput
          multiline
          ref={ref as any}
          id={textareaId}
          fullWidth
          style={style}
          {...(props as any)}
        />
      </Wrapper>
    )
  },
)

Textarea.displayName = 'Textarea'
