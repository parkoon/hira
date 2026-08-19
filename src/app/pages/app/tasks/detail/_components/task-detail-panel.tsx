import { toast } from 'sonner'

import { useApproveTaskMutation } from '@/features/tasks/api/approve-task'
import type { Task } from '@/features/tasks/api/types'
import { ApprovalGate } from '@/features/tasks/components/approval-gate'
import { PanelCard, PanelCardField } from '@/features/tasks/components/panel-card'
import { PersonalDataLozenge } from '@/features/tasks/components/personal-data-lozenge'
import { PriorityLabel } from '@/features/tasks/components/priority-label'
import { APPROVAL_KIND_META } from '@/features/tasks/constants/metadata'
import { getDueDateStatus } from '@/features/tasks/utils/due-date'
import { getRequiredApprovals } from '@/features/tasks/utils/task-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { NameAvatar } from '@/shared/components/ui/name-avatar'

import { TaskProgressCard } from './task-progress-card'

/**
 * 우측 컬럼 — 진행 상태(전이) 카드 + 결재 + 세부 사항.
 * 상태에 관한 것은 전부 진행 상태 카드가 맡고, 레코드 수정은 브레드크럼의 '...' 메뉴가 맡는다.
 */
export function TaskDetailPanel({ task }: { task: Task }) {
  const { user } = useCurrentUser()
  const approveTask = useApproveTaskMutation()

  const due = getDueDateStatus(task.dueDate)
  const requiredApprovals = getRequiredApprovals(task)

  return (
    <div className="space-y-3">
      <TaskProgressCard task={task} />

      {/* 승인 전에만 결재를 받는다 — 승인 이후엔 결재 이력을 활동 로그에서 본다 (시나리오 3) */}
      {task.status === 'PENDING_APPROVAL' && requiredApprovals.length > 0 && (
        <PanelCard title="요청 승인 결재">
          <ApprovalGate
            required={requiredApprovals}
            approvals={task.approvals}
            onApprove={(kind) => {
              approveTask.mutate(
                { taskNo: task.taskNo, kind, actorName: user.name },
                {
                  onSuccess: () =>
                    toast.success(`${APPROVAL_KIND_META[kind].label} 결재를 승인했습니다.`),
                }
              )
            }}
          />
        </PanelCard>
      )}

      <PanelCard title="세부 사항">
        <PanelCardField label="담당자">
          <span className="flex items-center gap-1.5">
            <NameAvatar name={task.requester.name} />
            {task.requester.name} · {task.requester.dept}
          </span>
        </PanelCardField>

        <PanelCardField label="사전협의자">
          {/* 이 필드가 생기기 전에 등록된 건은 값이 없다 */}
          {task.consultant ? (
            <span className="flex items-center gap-1.5">
              <NameAvatar name={task.consultant.name} />
              {task.consultant.name} · {task.consultant.dept}
            </span>
          ) : (
            <span className="text-muted-foreground">없음</span>
          )}
        </PanelCardField>

        <PanelCardField label="목표일">
          <span className="flex items-center gap-1.5">
            {task.dueDate}
            {task.status !== 'DONE' && <Lozenge tone={due.tone}>{due.label}</Lozenge>}
          </span>
        </PanelCardField>

        <PanelCardField label="우선순위">
          <PriorityLabel priority={task.priority} />
        </PanelCardField>

        <PanelCardField label="컴플라이언스">
          {task.handlesPersonalData || task.consumerProtectionTarget ? (
            <span className="flex flex-wrap items-center gap-1.5">
              {task.handlesPersonalData && <PersonalDataLozenge withIcon />}
              {task.consumerProtectionTarget && <Lozenge tone="warning">소비자보호 대상</Lozenge>}
            </span>
          ) : (
            <span className="text-muted-foreground">해당 없음</span>
          )}
        </PanelCardField>
      </PanelCard>
    </div>
  )
}
