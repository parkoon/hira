import type { ReactNode } from 'react'
import { toast } from 'sonner'

import { DropdownMenuItem } from '@/shared/components/ui/dropdown-menu'

type ActionMenuItemProps = {
  children: ReactNode
  /** 지금은 안 되는 이유 (없으면 그냥 실행) */
  reason?: string | null
  variant?: 'default' | 'destructive'
  onSelect: () => void
}

/**
 * 조건이 안 맞아도 막지 않고 누를 수 있게 두는 메뉴 항목 — 누르면 이유를 토스트로 알린다.
 * 회색으로 죽여두면 왜 안 되는지 물어볼 곳이 없다. 메뉴는 열려 있는 동안만 보이므로
 * 설명을 항목 옆에 붙여둘 자리도 마땅치 않다.
 */
export function ActionMenuItem({
  children,
  reason,
  variant = 'default',
  onSelect,
}: ActionMenuItemProps) {
  return (
    <DropdownMenuItem
      variant={variant}
      onSelect={() => (reason ? toast.warning(reason) : onSelect())}
    >
      {children}
    </DropdownMenuItem>
  )
}
