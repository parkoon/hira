import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useCreateTaskMutation } from '@/features/tasks/api/create-task'
import type { Task } from '@/features/tasks/api/types'
import { TaskFormModal } from '@/features/tasks/components/task-form/task-form-modal'
import { getUsersQueryOptions } from '@/features/users/api/get-users'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { selectAssignableUsers } from '@/features/users/utils/user-selectors'
import { paths } from '@/shared/config/paths'

type TaskCloneModalProps = {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 작업 복제 (Jira의 Clone) — 최종 완료 팝업이 안내하는 "추가 요건은 신규 작업으로
 * 등록"을 받치는 동선이다. 내용을 그대로 프리필한 새 요청대기중 건을 만든다.
 * 목표일은 비워서 다시 고르게 한다 — 끝난 요건의 날짜는 새 요건의 약속이 아니다.
 * 첨부는 복사하지 않는다 — 새 요건의 근거는 새로 붙인다.
 */
export function TaskCloneModal({ task, open, onOpenChange }: TaskCloneModalProps) {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  // 페이지가 이미 받아 둔 쿼리라 여기서 다시 서스펜드되지 않는다
  const usersQuery = useSuspenseQuery(getUsersQueryOptions())
  const createTask = useCreateTaskMutation()

  // 열 때마다 마운트해 원본의 현재 값으로 폼을 채운다
  if (!open) return null

  return (
    <TaskFormModal
      open
      onOpenChange={onOpenChange}
      title={`${task.taskNo} 복제`}
      submitLabel="복제"
      consultableUsers={selectAssignableUsers(usersQuery.data)}
      withAttachments
      defaultValues={{
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: '',
        consultantId: task.consultant?.id ?? '',
        handlesPersonalData: task.handlesPersonalData ? 'YES' : 'NO',
        consumerProtectionTarget: task.consumerProtectionTarget ? 'YES' : 'NO',
        darkPatternChecked: task.darkPatternChecked,
      }}
      // 채번이 연속번호라 두 번 눌리면 작업이 두 건 생긴다
      pending={createTask.isPending}
      onSubmit={(values) =>
        createTask.mutate(
          {
            draft: {
              title: values.title,
              description: values.description,
              priority: values.priority,
              dueDate: values.dueDate,
              consultantId: values.consultantId,
              handlesPersonalData: values.handlesPersonalData === 'YES',
              consumerProtectionTarget: values.consumerProtectionTarget === 'YES',
              darkPatternChecked: values.darkPatternChecked,
            },
            files: values.attachments,
            requesterId: user.id,
            requesterName: user.name,
          },
          {
            onSuccess: ({ taskNo, complete }) => {
              onOpenChange(false)
              if (complete) {
                toast.success(
                  `${task.taskNo}를 ${taskNo} 작업으로 복제했습니다. 내용을 확인하고 승인을 요청해 주세요.`
                )
              } else {
                toast.warning(
                  `${taskNo} 작업은 등록됐지만 일부 정보 저장에 실패했습니다. 상세 화면에서 내용을 확인해 주세요.`
                )
              }
              void navigate(paths.app.tasks.detail.getHref(taskNo))
            },
          }
        )
      }
    />
  )
}
