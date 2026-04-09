import { forwardRef, type SelectHTMLAttributes } from 'react'
import { SelectNative } from 'react95'
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

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  options: { value: string; label: string }[]
  onChange?: SelectHTMLAttributes<HTMLSelectElement>['onChange']
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, id, onChange, value, defaultValue, name, ...rest }, _ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <Wrapper>
        {label && <Label htmlFor={selectId}>{label}</Label>}
        <SelectNative
          id={selectId}
          width="100%"
          options={options}
          value={value as string}
          defaultValue={defaultValue as string}
          name={name}
          onChange={(opt) => {
            if (onChange) {
              const syntheticEvent = {
                target: { value: opt.value, name: name ?? '' },
                currentTarget: { value: opt.value, name: name ?? '' },
              } as React.ChangeEvent<HTMLSelectElement>
              onChange(syntheticEvent)
            }
          }}
          {...(rest as any)}
        />
      </Wrapper>
    )
  },
)

Select.displayName = 'Select'
