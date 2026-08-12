import { SearchIcon, XIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group'
import { cn } from '@/shared/utils/cn'

import { FilterChip } from './filter-chip'
import { FilterMenu } from './filter-menu'
import type { FilterBarField, FilterBarValue } from './types'

type FilterBarProps = {
  fields: FilterBarField[]
  value: FilterBarValue
  onChange: (value: FilterBarValue) => void
  /** 자유 텍스트 검색어. `onSearchChange`와 함께 전달할 때만 검색 인풋을 렌더한다. */
  search?: string
  onSearchChange?: (search: string) => void
  searchPlaceholder?: string
  className?: string
}

/**
 * 검색 인풋 + 멀티선택 필터 칩으로 구성된 목록 필터 바.
 * "필터" 메뉴에서 필드를 고르거나, 값 라벨을 바로 검색해 적용한다.
 */
export function FilterBar({
  fields,
  value,
  onChange,
  search,
  onSearchChange,
  searchPlaceholder = '검색',
  className,
}: FilterBarProps) {
  const activeFields = fields.filter((field) => (value[field.key] ?? []).length > 0)
  const isFiltered = activeFields.length > 0 || Boolean(search)

  const setFieldValues = (key: string, values: string[]) => {
    onChange({ ...value, [key]: values })
  }

  const clearAll = () => {
    onChange({})
    onSearchChange?.('')
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {onSearchChange && (
        <InputGroup className="h-7 w-56">
          <InputGroupAddon>
            <SearchIcon className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            value={search ?? ''}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-full"
          />
        </InputGroup>
      )}
      {activeFields.map((field) => (
        <FilterChip
          key={field.key}
          field={field}
          selected={value[field.key] ?? []}
          onSelectedChange={(values) => setFieldValues(field.key, values)}
        />
      ))}
      <FilterMenu
        fields={fields}
        value={value}
        onSelect={setFieldValues}
      />
      {isFiltered && (
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={clearAll}
        >
          <XIcon />
          초기화
        </Button>
      )}
    </div>
  )
}
