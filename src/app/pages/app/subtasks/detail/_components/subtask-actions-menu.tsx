import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useDeleteSubtaskMutation } from '@/features/tasks/api/delete-subtask'
import type { Subtask } from '@/features/tasks/api/types'
import { ActionMenuItem } from '@/features/tasks/components/action-menu-item'
import { getSubtaskDeletionState, getSubtaskEditState } from '@/features/tasks/utils/task-selectors'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { paths } from '@/shared/config/paths'
import { useConfirm } from '@/shared/hooks/use-confirm'

type SubtaskActionsMenuProps = {
  subtask: Subtask
  /** 수정 권한 보유 여부. 상태 조건은 별도로 검사한다 */
  canEdit: boolean
  onEdit: () => void
  /** 삭제 권한 보유 여부. 상태 조건은 별도로 검사한다 (스펙 §11.3) */
  canDelete: boolean
}

export function SubtaskActionsMenu({
  subtask,
  canEdit,
  onEdit,
  canDelete,
}: SubtaskActionsMenuProps) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const deleteSubtask = useDeleteSubtaskMutation()

  const edit = getSubtaskEditState(subtask)
  const deletion = getSubtaskDeletionState(subtask)

  const handleDelete = async () => {
    const confirmed = await confirm.open({
      title: `${subtask.subtaskNo} 삭제`,
      description:
        '삭제한 하위작업은 복구할 수 없습니다. 상위 작업의 진행률에서도 함께 제외됩니다.',
      confirm: { text: '삭제', variant: 'destructive' },
    })
    if (!confirmed) return

    deleteSubtask.mutate(
      { subtaskNo: subtask.subtaskNo },
      {
        onSuccess: () => {
          toast.success(`${subtask.subtaskNo} 하위작업을 삭제했습니다.`)
          void navigate(paths.app.tasks.detail.getHref(subtask.parentTaskNo))
        },
      }
    )
  }

  // 주체가 아니면 항목을 감춘다. 둘 다 감추면 열 게 없으니 트리거도 두지 않는다
  if (!canEdit && !canDelete) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="하위작업 메뉴"
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64"
      >
        {canEdit && (
          <ActionMenuItem
            reason={edit.reason}
            onSelect={onEdit}
          >
            <PencilIcon />
            하위작업 수정
          </ActionMenuItem>
        )}

        {canDelete && (
          <>
            {canEdit && <DropdownMenuSeparator />}
            <ActionMenuItem
              variant="destructive"
              reason={deletion.reason}
              onSelect={() => void handleDelete()}
            >
              <Trash2Icon />
              하위작업 삭제
            </ActionMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
