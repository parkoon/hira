import { SquareCheckIcon } from 'lucide-react'
import { Link } from 'react-router'

import type { Request } from '@/features/issues/api/types'
import { SubtaskStatusLozenge } from '@/features/issues/components/subtask-status-lozenge'
import { getSubtaskProgress } from '@/features/issues/utils/issue-selectors'
import { Card } from '@/shared/components/ui/card'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { Progress } from '@/shared/components/ui/progress'
import { paths } from '@/shared/config/paths'

export function SubtaskList({ request }: { request: Request }) {
  const { done, total } = getSubtaskProgress(request)

  // Jira와 동일하게 하위작업이 없으면 섹션 자체를 그리지 않는다 (생성 진입점은 상단 버튼)
  if (total === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold">하위작업</span>
        <Progress
          value={(done / total) * 100}
          className="h-1.5 flex-1"
        />
        <span className="text-muted-foreground text-[11px]">
          {done}/{total} 완료
        </span>
      </div>

      <Card className="divide-border gap-0 divide-y overflow-hidden py-0">
        {request.subtasks.map((subtask) => (
          <Link
            key={subtask.issueNo}
            to={paths.app.issues.subtask.getHref(request.issueNo, subtask.issueNo)}
            className="hover:bg-muted/50 flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors"
          >
            <SquareCheckIcon className="size-3.5 shrink-0 text-blue-700 dark:text-blue-400" />
            <span className="shrink-0 font-medium text-blue-700 dark:text-blue-400">
              {subtask.issueNo.slice(request.issueNo.length)}
            </span>
            <span className="flex-1 truncate">{subtask.title}</span>
            <NameAvatar name={subtask.assignee.name} />
            <SubtaskStatusLozenge status={subtask.status} />
          </Link>
        ))}
      </Card>
    </div>
  )
}
