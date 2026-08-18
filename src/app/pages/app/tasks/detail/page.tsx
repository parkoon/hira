import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { useAttachFilesMutation } from '@/features/tasks/api/attach-files'
import { useCreateSubtaskMutation } from '@/features/tasks/api/create-subtask'
import { useDeleteAttachmentsMutation } from '@/features/tasks/api/delete-attachments'
import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks'
import { useUpdateTaskMutation } from '@/features/tasks/api/update-task'
import { SubtaskFormModal } from '@/features/tasks/components/subtask-form-modal'
import { TaskDescription } from '@/features/tasks/components/task-description'
import { TaskDetailHeader } from '@/features/tasks/components/task-detail-header'
import { TaskFormModal } from '@/features/tasks/components/task-form/task-form-modal'
import { canEditTask, canViewTask, selectTaskByTaskNo } from '@/features/tasks/utils/task-selectors'
import { getUsersQueryOptions } from '@/features/users/api/get-users'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { selectAssignableUsers } from '@/features/users/utils/user-selectors'
import { Empty } from '@/shared/components/ui/empty'
import { Page } from '@/shared/components/ui/layout/page'
import { paths } from '@/shared/config/paths'

import { SubtaskList } from './_components/subtask-list'
import { TaskActionsMenu } from './_components/task-actions-menu'
import { TaskActivity } from './_components/task-activity'
import { TaskAttachments } from './_components/task-attachments'
import { TaskDetailPanel } from './_components/task-detail-panel'

/** 화면 6 — 작업 상세 (Jira 신규 이슈 뷰 배치) */
function TaskDetailPage() {
  const { taskNo = '' } = useParams()
  const { user, hasRole } = useCurrentUser()
  const [subtaskCreateOpen, setSubtaskCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const tasksQuery = useSuspenseQuery(getTasksQueryOptions())
  const usersQuery = useSuspenseQuery(getUsersQueryOptions())
  const createSubtask = useCreateSubtaskMutation()
  const updateTask = useUpdateTaskMutation()
  const attachFiles = useAttachFilesMutation()
  const deleteAttachments = useDeleteAttachmentsMutation()

  const task = selectTaskByTaskNo(tasksQuery.data, taskNo)

  // 담당자는 본인이 등록한 건만 볼 수 있다 (스펙 §3.3) — 목록과 같은 규칙을 URL 직접 접근에도 적용한다
  const visible = task !== undefined && canViewTask(task, user)

  if (!task || !visible) {
    return (
      <Empty
        className="m-6 w-auto"
        title="작업을 찾을 수 없습니다"
        description={`${taskNo}에 해당하는 작업이 없습니다.`}
      />
    )
  }

  // 하위작업 생성은 작업자도 가능하다 (스펙 §5.1의 리드 전용 규칙에서 완화)
  const canCreateSubtask = hasRole('WORKER')

  return (
    <Page>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <TaskDetailHeader
            breadcrumb={[
              { label: '작업 목록', to: paths.app.tasks.root.getHref() },
              { label: task.taskNo },
            ]}
            title={task.title}
            actions={
              <TaskActionsMenu
                task={task}
                canEdit={canEditTask(task, user)}
                onEdit={() => setEditOpen(true)}
              />
            }
          />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">설명</h2>
            <TaskDescription html={task.description} />
          </section>

          <TaskAttachments task={task} />
          <SubtaskList
            task={task}
            canCreate={canCreateSubtask}
            createBlockedReason={
              task.status === 'IN_PROGRESS' ? null : '작업중 상태에서만 하위작업을 만들 수 있어요'
            }
            onCreate={() => setSubtaskCreateOpen(true)}
          />
          <TaskActivity task={task} />
        </div>

        {/*
          패널이 화면보다 길어질 수 있어 자체 스크롤을 준다. sticky만 걸면 넘치는 아래쪽에
          닿을 수 없다. px-1/-mx-1은 카드 테두리(ring = 바깥 box-shadow)가 스크롤 경계에
          잘리지 않게 좌우 여유를 두고 그만큼 자리를 되돌리는 것이다.
        */}
        <div className="w-full shrink-0 lg:sticky lg:top-3 lg:-m-1 lg:max-h-[calc(100dvh-4.5rem)] lg:w-102 lg:self-start lg:overflow-y-auto lg:p-1">
          <TaskDetailPanel task={task} />
        </div>
      </div>

      {/* 열 때마다 마운트해 현재 값으로 폼을 채운다 */}
      {editOpen && (
        <TaskFormModal
          open
          onOpenChange={setEditOpen}
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
                  setEditOpen(false)
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
      )}

      <SubtaskFormModal
        open={subtaskCreateOpen}
        onOpenChange={setSubtaskCreateOpen}
        title="하위작업 생성"
        submitLabel="생성"
        assignableUsers={selectAssignableUsers(usersQuery.data)}
        onSubmit={(draft) =>
          createSubtask.mutate(
            { parentTaskNo: task.taskNo, draft, actorName: user.name },
            { onSuccess: () => toast.success(`하위작업 "${draft.title}"을(를) 생성했습니다.`) }
          )
        }
      />
    </Page>
  )
}

export { TaskDetailPage as Component }
