import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks'
import { useUpdateSubtaskMutation } from '@/features/tasks/api/update-subtask'
import { SubtaskFormModal } from '@/features/tasks/components/subtask-form-modal'
import { TaskDescription } from '@/features/tasks/components/task-description'
import { TaskDetailHeader } from '@/features/tasks/components/task-detail-header'
import {
  canViewTask,
  selectSubtaskBySubtaskNo,
  selectTaskByTaskNo,
} from '@/features/tasks/utils/task-selectors'
import { getUsersQueryOptions } from '@/features/users/api/get-users'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { selectAssignableUsers } from '@/features/users/utils/user-selectors'
import { Empty } from '@/shared/components/ui/empty'
import { Page } from '@/shared/components/ui/layout/page'
import { paths } from '@/shared/config/paths'

import { SubtaskActionsMenu } from './_components/subtask-actions-menu'
import { SubtaskActivity } from './_components/subtask-activity'
import { SubtaskDetailPanel } from './_components/subtask-detail-panel'
import { TransitionEvidenceCard } from './_components/transition-evidence-card'

/** 화면 8 — 하위작업 상세 (Jira 신규 이슈 뷰 배치) */
function SubtaskDetailPage() {
  const { subtaskNo = '' } = useParams()
  const { user, hasRole } = useCurrentUser()
  const [editOpen, setEditOpen] = useState(false)

  const tasksQuery = useSuspenseQuery(getTasksQueryOptions())
  // 수정 모달이 열릴 때 화면이 서스펜드되지 않도록 담당자 후보를 미리 받아 둔다
  const usersQuery = useSuspenseQuery(getUsersQueryOptions())
  const updateSubtask = useUpdateSubtaskMutation()

  const subtask = selectSubtaskBySubtaskNo(tasksQuery.data, subtaskNo)
  const task = subtask ? selectTaskByTaskNo(tasksQuery.data, subtask.parentTaskNo) : undefined

  // 요청자는 본인이 등록한 작업의 하위작업만 볼 수 있다 (스펙 §3.3) — URL 직접 접근에도 적용
  const visible = task !== undefined && canViewTask(task, user)

  if (!subtask || !task || !visible) {
    return (
      <Empty
        className="m-6 w-auto"
        title="하위작업을 찾을 수 없습니다"
        description={`${subtaskNo}에 해당하는 하위작업이 없습니다.`}
      />
    )
  }

  // 담당자 본인 또는 리드 이상만 전이할 수 있다 (스펙 §5.2)
  const canTransition = hasRole('LEAD') || subtask.assignee.id === user.id
  // 하위작업 수정·배정·삭제는 작업자 이상이 수행한다 (스펙 §5.1)
  const canManageSubtask = hasRole('WORKER')

  return (
    <Page>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <TaskDetailHeader
            breadcrumb={[
              { label: '작업 목록', to: paths.app.tasks.root.getHref() },
              {
                label: subtask.parentTaskNo,
                to: paths.app.tasks.detail.getHref(subtask.parentTaskNo),
              },
              { label: subtask.subtaskNo },
            ]}
            title={subtask.title}
            actions={
              <SubtaskActionsMenu
                subtask={subtask}
                canEdit={canManageSubtask}
                onEdit={() => setEditOpen(true)}
                canDelete={canManageSubtask}
              />
            }
          />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">설명</h2>
            <TaskDescription html={subtask.description} />
          </section>

          <TransitionEvidenceCard
            subtask={subtask}
            canEdit={canTransition}
          />

          <SubtaskActivity subtask={subtask} />
        </div>

        {/*
          패널이 화면보다 길어질 수 있어(진행 단계 9칸) 자체 스크롤을 준다. sticky만 걸면
          넘치는 아래쪽에 닿을 수 없다. px-1/-mx-1은 카드 테두리(ring = 바깥 box-shadow)가
          스크롤 경계에 잘리지 않게 좌우 여유를 두고 그만큼 자리를 되돌리는 것이다.
        */}
        <div className="w-full shrink-0 lg:sticky lg:top-3 lg:-m-1 lg:max-h-[calc(100dvh-4.5rem)] lg:w-102 lg:self-start lg:overflow-y-auto lg:p-1">
          <SubtaskDetailPanel
            subtask={subtask}
            task={task}
            canTransition={canTransition}
          />
        </div>
      </div>

      {/* 열 때마다 마운트해 현재 값으로 폼을 채운다 */}
      {editOpen && (
        <SubtaskFormModal
          open
          onOpenChange={setEditOpen}
          title={`${subtask.subtaskNo} 수정`}
          submitLabel="저장"
          assignableUsers={selectAssignableUsers(usersQuery.data)}
          defaultValues={subtask}
          lockedType={subtask.type}
          onSubmit={(values) =>
            updateSubtask.mutate(
              {
                subtaskNo: subtask.subtaskNo,
                // 유형은 고정이라 넘기지 않는다
                patch: {
                  title: values.title,
                  description: values.description,
                  assignee: values.assignee,
                  dueDate: values.dueDate,
                },
                actorName: user.name,
              },
              {
                // 값이 그대로면 아무것도 기록되지 않으므로 수정했다고 알리지 않는다
                onSuccess: (changed) =>
                  changed && toast.success(`${subtask.subtaskNo} 하위작업을 수정했습니다.`),
              }
            )
          }
        />
      )}
    </Page>
  )
}

export { SubtaskDetailPage as Component }
