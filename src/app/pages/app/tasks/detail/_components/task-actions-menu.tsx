import { CopyIcon, MoreHorizontalIcon, PencilIcon } from 'lucide-react'

import type { Task } from '@/features/tasks/api/types'
import { ActionMenuItem } from '@/features/tasks/components/action-menu-item'
import { getTaskEditState } from '@/features/tasks/utils/task-selectors'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

type TaskActionsMenuProps = {
  task: Task
  /** 수정 주체인지 — 등록자 본인이 아니면 메뉴 자체가 없다 */
  canEdit: boolean
  onEdit: () => void
  onClone: () => void
}

/** 레코드 자체를 손대는 액션 — 하위작업 화면의 '...' 메뉴와 같은 자리, 같은 모양 */
export function TaskActionsMenu({ task, canEdit, onEdit, onClone }: TaskActionsMenuProps) {
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
        className="w-48"
      >
        <ActionMenuItem
          reason={edit.reason}
          onSelect={onEdit}
        >
          <PencilIcon />
          작업 수정
        </ActionMenuItem>
        {/* 복제는 상태를 가리지 않는다 — 완료된 요건의 추가 요건 등록이 주 용도다 */}
        <ActionMenuItem onSelect={onClone}>
          <CopyIcon />
          작업 복제
        </ActionMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
