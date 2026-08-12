import { CheckIcon } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/shared/utils/cn'

type MenuRowProps = {
  highlighted?: boolean
  onHover?: () => void
  onSelect: () => void
  children: React.ReactNode
}

export function MenuRow({ highlighted = false, onHover, onSelect, children }: MenuRowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={highlighted}
      data-highlighted={highlighted || undefined}
      ref={(node) => {
        if (highlighted) node?.scrollIntoView({ block: 'nearest' })
      }}
      onMouseMove={onHover}
      onClick={onSelect}
      className="hover:bg-muted data-highlighted:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none"
    >
      {children}
    </button>
  )
}

/** 팝오버 리스트 행에서 쓰는 체크 표시. 버튼 중첩을 피하려고 Checkbox 대신 시각만 재현한다. */
export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'border-input flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
        checked && 'border-primary bg-primary text-primary-foreground'
      )}
    >
      {checked && <CheckIcon className="size-3" />}
    </span>
  )
}
