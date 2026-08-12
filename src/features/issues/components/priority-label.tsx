import { ArrowDownIcon, ArrowUpIcon, ChevronsUpIcon, MinusIcon } from 'lucide-react'

import type { Priority } from '@/features/issues/api/types'
import { PRIORITY_META } from '@/features/issues/constants/metadata'
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

export function PriorityLabel({ priority }: { priority: Priority }) {
  const Icon = PRIORITY_ICON[priority]
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className={cn('size-3.5', PRIORITY_ICON_CLASS[priority])} />
      {PRIORITY_META[priority].label}
    </span>
  )
}
