import { ExternalLinkIcon, GitBranchIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useApproveSubtaskMutation } from '@/features/tasks/api/approve-subtask'
import type { Subtask, Task } from '@/features/tasks/api/types'
import { ApprovalGate } from '@/features/tasks/components/approval-gate'
import { PanelCard, PanelCardField } from '@/features/tasks/components/panel-card'
import { SUBTASK_TYPE_META } from '@/features/tasks/constants/metadata'
import { getDeploymentUrl, getSubtaskApprovalState } from '@/features/tasks/utils/task-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { NameAvatar } from '@/shared/components/ui/name-avatar'

import { CreateBranchDialog } from './create-branch-dialog'
import { SubtaskProgressCard } from './subtask-progress-card'

type SubtaskDetailPanelProps = {
  subtask: Subtask
  /** 이행 게이트 판정에 부모 상태가 필요하다 (시나리오 17) */
  task: Task
  canTransition: boolean
}

/** 우측 컬럼 — DBA 결재 + 진행 상태(전이) 카드 + 세부 사항 + 개발(브랜치) */
export function SubtaskDetailPanel({ subtask, task, canTransition }: SubtaskDetailPanelProps) {
  const { user } = useCurrentUser()
  const approveSubtask = useApproveSubtaskMutation()

  const deploymentUrl = getDeploymentUrl(subtask)
  const requiredApprovals = getSubtaskApprovalState(subtask).required

  return (
    <div className="space-y-3">
      {/* DBA 검증중에만 노출 — 결재가 떨어지면 제3자검증중으로 자동 전이한다 (시나리오 9) */}
      {subtask.status === 'DBA_VERIFICATION' && requiredApprovals.length > 0 && (
        <PanelCard title="DBA 검증 결재">
          <ApprovalGate
            description={subtask.dbaVerificationRequest}
            required={requiredApprovals}
            approvals={subtask.approvals}
            onApprove={(kind) => {
              approveSubtask.mutate(
                { subtaskNo: subtask.subtaskNo, kind, actorName: user.name },
                {
                  onSuccess: () =>
                    toast.success('DBA 결재를 승인했습니다. 제3자검증중으로 넘어갑니다.'),
                }
              )
            }}
          />
        </PanelCard>
      )}

      <SubtaskProgressCard
        subtask={subtask}
        task={task}
        canTransition={canTransition}
      />

      <PanelCard title="세부 사항">
        <PanelCardField label="담당자">
          <span className="flex items-center gap-1.5">
            <NameAvatar name={subtask.assignee.name} />
            {subtask.assignee.name}
          </span>
        </PanelCardField>

        <PanelCardField label="유형">{SUBTASK_TYPE_META[subtask.type].label}</PanelCardField>

        <PanelCardField label="목표일">{subtask.dueDate ?? '—'}</PanelCardField>

        {subtask.completedAt && (
          <PanelCardField label="완료일">{subtask.completedAt}</PanelCardField>
        )}

        {/* 브랜치가 없으면 생성 액션, 생기면 링크로 대체된다 (하위작업과 1:1) */}
        {subtask.type === 'DEPLOY' && (
          <PanelCardField label="브랜치">
            {subtask.branch ? (
              <a
                href={subtask.branch.branchUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex min-w-0 items-center gap-1.5"
              >
                <GitBranchIcon className="text-muted-foreground size-3.5 shrink-0" />
                <span className="truncate text-blue-700 group-hover:underline dark:text-blue-400">
                  {subtask.branch.branchName}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {subtask.branch.repoFullName.split('/')[1]}
                </span>
                <ExternalLinkIcon className="text-muted-foreground size-3 shrink-0" />
              </a>
            ) : (
              <CreateBranchDialog subtaskNo={subtask.subtaskNo} />
            )}
          </PanelCardField>
        )}

        {deploymentUrl && (
          <PanelCardField label="배포 완료 URL">
            <a
              href={deploymentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-1 text-blue-700 hover:underline dark:text-blue-400"
            >
              <span className="truncate">{deploymentUrl}</span>
              <ExternalLinkIcon className="size-3 shrink-0" />
            </a>
          </PanelCardField>
        )}
      </PanelCard>
    </div>
  )
}
