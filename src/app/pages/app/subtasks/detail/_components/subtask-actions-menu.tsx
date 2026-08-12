import { MoreHorizontalIcon, Trash2Icon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useDeleteSubtaskMutation } from '@/features/issues/api/delete-subtask'
import type { Subtask } from '@/features/issues/api/types'
import { getSubtaskDeletionState } from '@/features/issues/utils/issue-selectors'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { paths } from '@/shared/config/paths'
import { useConfirm } from '@/shared/hooks/use-confirm'

type SubtaskActionsMenuProps = {
  subtask: Subtask
  /** 삭제 권한 보유 여부. 상태 조건은 별도로 검사한다 (스펙 §11.3) */
  canDelete: boolean
}

export function SubtaskActionsMenu({ subtask, canDelete }: SubtaskActionsMenuProps) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const deleteSubtask = useDeleteSubtaskMutation()

  const deletion = getSubtaskDeletionState(subtask)

  const handleDelete = async () => {
    const confirmed = await confirm.open({
      title: `${subtask.issueNo} 삭제`,
      description:
        '삭제한 하위작업은 복구할 수 없습니다. 상위 이슈의 진행률에서도 함께 제외됩니다.',
      confirm: { text: '삭제', variant: 'destructive' },
    })
    if (!confirmed) return

    deleteSubtask.mutate(
      { subtaskNo: subtask.issueNo },
      {
        onSuccess: () => {
          toast.success(`${subtask.issueNo} 하위작업을 삭제했습니다.`)
          void navigate(paths.app.issues.detail.getHref(subtask.parentIssueNo))
        },
      }
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="하위작업 작업 메뉴"
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64"
      >
        <DropdownMenuItem
          variant="destructive"
          disabled={!canDelete || !deletion.enabled}
          onSelect={() => void handleDelete()}
        >
          <Trash2Icon />
          삭제
        </DropdownMenuItem>
        {canDelete && deletion.reason && (
          <p className="text-muted-foreground px-1.5 pt-0.5 pb-1 text-[11px] leading-snug">
            {deletion.reason}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
