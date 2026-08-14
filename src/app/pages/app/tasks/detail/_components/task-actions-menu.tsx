import { MoreHorizontalIcon, PencilIcon } from 'lucide-react'

import type { Task } from '@/features/tasks/api/types'
import { getTaskEditState } from '@/features/tasks/utils/task-selectors'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

type TaskActionsMenuProps = {
  task: Task
  /** 수정 주체인지 — 등록자 본인이 아니면 메뉴 자체가 없다 */
  canEdit: boolean
  onEdit: () => void
}

/** 레코드 자체를 손대는 액션 — 하위작업 화면의 '...' 메뉴와 같은 자리, 같은 모양 */
export function TaskActionsMenu({ task, canEdit, onEdit }: TaskActionsMenuProps) {
  // 주체가 아니면 트리거도 두지 않는다 — 빈 메뉴가 열리면 안 된다
  if (!canEdit) return null

  const edit = getTaskEditState(task)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="작업 메뉴"
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64"
      >
        <DropdownMenuItem
          disabled={!edit.enabled}
          onSelect={onEdit}
        >
          <PencilIcon />
          작업 수정
        </DropdownMenuItem>
        {edit.reason && (
          <p className="text-muted-foreground px-1.5 pt-0.5 pb-1 text-[11px] leading-snug">
            {edit.reason}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
