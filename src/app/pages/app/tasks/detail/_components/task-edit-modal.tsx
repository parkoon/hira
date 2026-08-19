import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useAttachFilesMutation } from '@/features/tasks/api/attach-files'
import { useDeleteAttachmentsMutation } from '@/features/tasks/api/delete-attachments'
import type { Task } from '@/features/tasks/api/types'
import { useUpdateTaskMutation } from '@/features/tasks/api/update-task'
import { TaskFormModal } from '@/features/tasks/components/task-form/task-form-modal'
import { getUsersQueryOptions } from '@/features/users/api/get-users'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { selectAssignableUsers } from '@/features/users/utils/user-selectors'

type TaskEditModalProps = {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 작업 수정 — 폼과 저장(내용 수정·첨부 추가·첨부 삭제 뮤테이션)을 한곳에 캡슐화한다
 * (`task-create-modal`과 대칭). 페이지는 열림 상태만 쥔다 —
 * 트리거가 '...' 메뉴 안에 있어 생성 모달처럼 버튼까지 품지는 않는다.
 */
export function TaskEditModal({ task, open, onOpenChange }: TaskEditModalProps) {
  const { user } = useCurrentUser()
  // 페이지가 이미 받아 둔 쿼리라 여기서 다시 서스펜드되지 않는다
  const usersQuery = useSuspenseQuery(getUsersQueryOptions())
  const updateTask = useUpdateTaskMutation()
  const attachFiles = useAttachFilesMutation()
  const deleteAttachments = useDeleteAttachmentsMutation()

  // 열 때마다 마운트해 현재 값으로 폼을 채운다
  if (!open) return null

  return (
    <TaskFormModal
      open
      onOpenChange={onOpenChange}
      title={`${task.taskNo} 수정`}
      submitLabel="저장"
      consultableUsers={selectAssignableUsers(usersQuery.data)}
      // 첨부 가능 조건이 수정 가능 조건과 같아 한 폼에 둔다 — 규칙이 갈라질 자리를 없앤다
      withAttachments
      existingAttachments={task.attachments}
      defaultValues={{
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        consultantId: task.consultant?.id ?? '',
        handlesPersonalData: task.handlesPersonalData ? 'YES' : 'NO',
        consumerProtectionTarget: task.consumerProtectionTarget ? 'YES' : 'NO',
        darkPatternChecked: task.darkPatternChecked,
      }}
      pending={updateTask.isPending}
      onSubmit={(values) =>
        updateTask.mutate(
          {
            taskNo: task.taskNo,
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
            actorName: user.name,
          },
          {
            onSuccess: (changed) => {
              onOpenChange(false)
              // 첨부는 이력을 따로 남기는 별개 동작이라 내용 수정과 나눠 부른다
              const removed = task.attachments.filter((attachment) =>
                values.removedAttachmentIds.includes(attachment.id)
              )
              if (removed.length > 0) {
                deleteAttachments.mutate(
                  { taskNo: task.taskNo, attachments: removed, actorName: user.name },
                  {
                    onSuccess: () => toast.success(`첨부 ${removed.length}개를 뗐습니다.`),
                  }
                )
              }
              if (values.attachments.length > 0) {
                attachFiles.mutate(
                  {
                    taskNo: task.taskNo,
                    files: values.attachments,
                    actorName: user.name,
                  },
                  {
                    onSuccess: () =>
                      toast.success(`${values.attachments.length}개 파일을 첨부했습니다.`),
                  }
                )
              }
              // 값이 그대로면 아무것도 기록되지 않으므로 수정했다고 알리지 않는다
              if (changed) toast.success(`${task.taskNo} 작업을 수정했습니다.`)
            },
          }
        )
      }
    />
  )
}
