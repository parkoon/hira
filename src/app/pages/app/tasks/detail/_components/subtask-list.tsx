import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router'

import type { Task } from '@/features/tasks/api/types'
import { SubtaskStatusLozenge } from '@/features/tasks/components/subtask-status-lozenge'
import { getSubtaskProgress } from '@/features/tasks/utils/task-selectors'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { Progress } from '@/shared/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { paths } from '@/shared/config/paths'

type SubtaskListProps = {
  task: Task
  /** 하위작업을 만들 수 있는 주체인지 — 아니면 섹션에 생성 버튼이 없다 */
  canCreate: boolean
  /** 주체는 맞는데 지금은 안 되는 이유 (없으면 활성) */
  createBlockedReason: string | null
  onCreate: () => void
}

/**
 * 하위작업 섹션. 생성 버튼은 대상 옆에 둔다 — 만들면 바로 이 목록에 쌓인다.
 * 0건이어도 섹션을 감추지 않는다. 감추면 첫 하위작업을 만들 자리가 사라진다.
 */
export function SubtaskList({ task, canCreate, createBlockedReason, onCreate }: SubtaskListProps) {
  const { done, total } = getSubtaskProgress(task)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold">하위작업</span>
        {total > 0 && (
          <>
            <Progress
              value={(done / total) * 100}
              className="h-1.5 flex-1"
            />
            <span className="text-muted-foreground text-[11px]">
              {done}/{total} 완료
            </span>
          </>
        )}

        {canCreate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={total > 0 ? 'inline-block' : 'ml-auto inline-block'}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="하위작업 만들기"
                  disabled={Boolean(createBlockedReason)}
                  onClick={onCreate}
                >
                  <PlusIcon />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{createBlockedReason ?? '하위작업 만들기'}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-[13px]">
          아직 하위작업이 없습니다.
        </p>
      ) : (
        <Card className="divide-border gap-0 divide-y overflow-hidden py-0">
          {task.subtasks.map((subtask) => (
            <Link
              key={subtask.subtaskNo}
              to={paths.app.tasks.subtask.getHref(task.taskNo, subtask.subtaskNo)}
              className="group hover:bg-muted/50 flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors"
            >
              {/* 부모 번호는 모든 행에 반복되므로 꼬리만 남긴다 (WR-2026-0001-01 → -01) */}
              <span className="text-muted-foreground shrink-0">
                {subtask.subtaskNo.slice(task.taskNo.length)}
              </span>
              {/* 행 전체가 링크라, 누르려는 대상인 제목이 링크색을 갖는다 */}
              <span className="flex-1 truncate font-medium text-blue-700 group-hover:underline dark:text-blue-400">
                {subtask.title}
              </span>
              <NameAvatar name={subtask.assignee.name} />
              <SubtaskStatusLozenge status={subtask.status} />
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}
