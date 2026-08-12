import { ChevronLeftIcon, ListFilterIcon, SearchIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'

import { CheckMark, MenuRow } from './menu-row'
import type { FilterBarField, FilterBarValue } from './types'
import { buildFilterMenuItems, type FilterMenuItem, toggleValue } from './utils'

type FilterMenuProps = {
  fields: FilterBarField[]
  value: FilterBarValue
  onSelect: (key: string, values: string[]) => void
}

/**
 * "필터" 버튼 메뉴. 필드 목록 → 값 목록 2단계로 이동하며,
 * 필드 목록에서 값 라벨을 검색하면 필드를 건너뛰고 바로 적용할 수 있다.
 */
export function FilterMenu({ fields, value, onSelect }: FilterMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [activeKey, setActiveKey] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')
  const [highlighted, setHighlighted] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const activeField = fields.find((field) => field.key === activeKey) ?? null
  const items = React.useMemo(
    () => buildFilterMenuItems(fields, activeField, query),
    [fields, activeField, query]
  )
  const highlightedIndex = Math.min(highlighted, Math.max(items.length - 1, 0))

  const showList = (key: string | null) => {
    setActiveKey(key)
    setQuery('')
    setHighlighted(0)
  }

  const selectItem = (item: FilterMenuItem) => {
    if (item.type === 'field') {
      showList(item.field.key)
      return
    }
    if (item.field.multiple === false) {
      onSelect(item.field.key, [item.option.value])
      setOpen(false)
      return
    }
    onSelect(item.field.key, toggleValue(value[item.field.key] ?? [], item.option.value))
    // 값 목록으로 전환해 연속 선택을 돕는다. 방금 고른 값에 하이라이트를 유지한다.
    setActiveKey(item.field.key)
    setQuery('')
    setHighlighted(Math.max(item.field.options.indexOf(item.option), 0))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted(Math.min(highlightedIndex + 1, items.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted(Math.max(highlightedIndex - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const item = items[highlightedIndex]
      if (item) selectItem(item)
      return
    }
    if (event.key === 'Backspace' && query === '' && activeField) {
      showList(null)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) showList(null)
  }

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="border-input text-muted-foreground border border-dashed"
        >
          <ListFilterIcon />
          필터
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-60 gap-0 overflow-hidden p-0"
      >
        <div className="border-border flex items-center gap-1.5 border-b px-2.5">
          {activeField ? (
            <button
              type="button"
              aria-label="필터 목록으로 돌아가기"
              onClick={() => {
                showList(null)
                inputRef.current?.focus()
              }}
              className="text-muted-foreground hover:text-foreground -ml-1 flex size-5 shrink-0 items-center justify-center outline-none"
            >
              <ChevronLeftIcon className="size-3.5" />
            </button>
          ) : (
            <SearchIcon className="text-muted-foreground size-3.5 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setHighlighted(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder={activeField ? `${activeField.label} 검색` : '필터 검색'}
            aria-label={activeField ? `${activeField.label} 검색` : '필터 검색'}
            className="placeholder:text-muted-foreground h-9 w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div
          role="listbox"
          aria-label="필터 항목"
          className="max-h-64 overflow-y-auto p-1.5"
        >
          {items.length === 0 && (
            <p className="text-muted-foreground px-2 py-1.5 text-sm">결과 없음</p>
          )}
          {items.map((item, index) => (
            <MenuRow
              key={
                item.type === 'field' ? item.field.key : `${item.field.key}:${item.option.value}`
              }
              highlighted={index === highlightedIndex}
              onHover={() => setHighlighted(index)}
              onSelect={() => selectItem(item)}
            >
              {item.type === 'field' ? (
                <span className="truncate">{item.field.label}</span>
              ) : (
                <>
                  <CheckMark checked={(value[item.field.key] ?? []).includes(item.option.value)} />
                  <span className="truncate">
                    {activeField ? item.option.label : `${item.field.label}: ${item.option.label}`}
                  </span>
                </>
              )}
            </MenuRow>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
