import { XIcon } from 'lucide-react'
import * as React from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'

import { CheckMark, MenuRow } from './menu-row'
import type { FilterBarField } from './types'
import { summarizeSelection, toggleValue } from './utils'

type FilterChipProps = {
  field: FilterBarField
  selected: string[]
  onSelectedChange: (values: string[]) => void
}

/** `상태 | 진행중 | ×` 형태의 적용된 필터 칩. 값 클릭 시 값 선택 팝오버를 연다. */
export function FilterChip({ field, selected, onSelectedChange }: FilterChipProps) {
  const [open, setOpen] = React.useState(false)

  const selectOption = (optionValue: string) => {
    if (field.multiple === false) {
      onSelectedChange([optionValue])
      setOpen(false)
      return
    }
    onSelectedChange(toggleValue(selected, optionValue))
  }

  return (
    <div className="border-input flex h-7 items-stretch overflow-hidden rounded-[min(var(--radius-md),10px)] border">
      <span className="text-muted-foreground flex items-center pr-1 pl-2.5 text-xs">
        {field.label}
      </span>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="hover:bg-muted focus-visible:bg-muted flex items-center px-1.5 text-sm outline-none"
          >
            {summarizeSelection(field, selected)}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-56 gap-0 p-1.5"
        >
          <div
            role="listbox"
            aria-multiselectable={field.multiple !== false}
            aria-label={`${field.label} 필터`}
            className="flex flex-col"
          >
            {field.options.map((option) => (
              <MenuRow
                key={option.value}
                onSelect={() => selectOption(option.value)}
              >
                <CheckMark checked={selected.includes(option.value)} />
                <span className="truncate">{option.label}</span>
              </MenuRow>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <button
        type="button"
        aria-label={`${field.label} 필터 제거`}
        onClick={() => onSelectedChange([])}
        className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted flex items-center px-1.5 outline-none"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  )
}
