import { FileTextIcon, RocketIcon } from 'lucide-react'

import type { SubtaskType } from '@/features/issues/api/types'
import { SUBTASK_TYPE_META } from '@/features/issues/constants/metadata'
import { cn } from '@/shared/utils/cn'

/** 배포가 필요한지 아닌지를 모양으로 가른다 — 로젠지의 파랑/회색은 색으로만 갈렸다 */
const SUBTASK_TYPE_ICON: Record<SubtaskType, React.ComponentType<{ className?: string }>> = {
  DEPLOY: RocketIcon,
  NON_DEPLOY: FileTextIcon,
}

const SUBTASK_TYPE_ICON_CLASS: Record<SubtaskType, string> = {
  DEPLOY: 'text-blue-600 dark:text-blue-400',
  NON_DEPLOY: 'text-muted-foreground',
}

/**
 * 이슈유형 표기 — 단일값 enum은 색 블록이 아니라 아이콘 + 텍스트로 둔다 (`PriorityLabel`과 같은 규칙).
 * 로젠지는 여러 행을 색으로 훑는 목록과, 개수가 들쭉날쭉한 태그(컴플라이언스)의 몫이다.
 */
export function SubtaskTypeLabel({ type }: { type: SubtaskType }) {
  const Icon = SUBTASK_TYPE_ICON[type]

  return (
    <span className="inline-flex items-center gap-1">
      <Icon className={cn('size-3.5', SUBTASK_TYPE_ICON_CLASS[type])} />
      {SUBTASK_TYPE_META[type].label}
    </span>
  )
}
