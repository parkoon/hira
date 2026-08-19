import { ArrowDownIcon, ArrowUpIcon, ChevronsUpIcon, MinusIcon } from 'lucide-react'

import type { Priority } from '@/features/tasks/api/types'
import { PRIORITY_META } from '@/features/tasks/constants/metadata'
import { cn } from '@/shared/utils/cn'

const PRIORITY_ICON: Record<Priority, React.ComponentType<{ className?: string }>> = {
  URGENT: ChevronsUpIcon,
  HIGH: ArrowUpIcon,
  NORMAL: MinusIcon,
  LOW: ArrowDownIcon,
}

const PRIORITY_ICON_CLASS: Record<Priority, string> = {
  URGENT: 'text-red-600 dark:text-red-400',
  HIGH: 'text-amber-600 dark:text-amber-400',
  NORMAL: 'text-muted-foreground',
  LOW: 'text-blue-600 dark:text-blue-400',
}

/** 아이콘만 — Jira 목록처럼 좁은 칼럼에서 툴팁과 함께 쓴다 */
export function PriorityIcon({ priority, className }: { priority: Priority; className?: string }) {
  const Icon = PRIORITY_ICON[priority]
  return <Icon className={cn('size-3.5', PRIORITY_ICON_CLASS[priority], className)} />
}

export function PriorityLabel({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1">
      <PriorityIcon priority={priority} />
      {PRIORITY_META[priority].label}
    </span>
  )
}
