import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useCreateTaskMutation } from '@/features/tasks/api/create-task'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { paths } from '@/shared/config/paths'

import { TaskFormModal } from './task-form-modal'

/** 헤더의 '새 작업' — 등록은 요청대기중까지만 만든다. 승인 요청은 상세에서 한다 (시나리오 1·2) */
export function TaskCreateModal() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const createTask = useCreateTaskMutation()

  return (
    <>
      <Button onClick={() => setOpen(true)}>새 작업</Button>

      {/* 열 때마다 마운트해 빈 폼으로 시작한다 */}
      {open && (
        <TaskFormModal
          open
          onOpenChange={setOpen}
          title="작업 등록"
          submitLabel="저장"
          withAttachments
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
                  setOpen(false)
                  if (complete) {
                    toast.success(
                      `${taskNo} 작업을 등록했습니다. 내용을 확인하고 승인을 요청해 주세요.`
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
      )}
    </>
  )
}
