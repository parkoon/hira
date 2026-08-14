import { ExternalLinkIcon, GitBranchIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useApproveSubtaskMutation } from '@/features/issues/api/approve-subtask'
import type { Request, Subtask } from '@/features/issues/api/types'
import { ApprovalGate } from '@/features/issues/components/approval-gate'
import { IssueKeyLink } from '@/features/issues/components/issue-key-link'
import { PanelCard, PanelCardField } from '@/features/issues/components/panel-card'
import { SUBTASK_TYPE_META } from '@/features/issues/constants/metadata'
import { getDeploymentUrl, getSubtaskApprovalState } from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { paths } from '@/shared/config/paths'

import { CreateBranchDialog } from './create-branch-dialog'
import { SubtaskStatusControl } from './subtask-status-control'

type SubtaskDetailPanelProps = {
  subtask: Subtask
  /** 이행 게이트 판정에 부모 상태가 필요하다 (시나리오 17) */
  request: Request
  canTransition: boolean
}

/** 우측 컬럼 — 상태 칩이 워크플로와 다음 단계 진행을 함께 연다 */
export function SubtaskDetailPanel({ subtask, request, canTransition }: SubtaskDetailPanelProps) {
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
                { subtaskNo: subtask.issueNo, kind, actorName: user.name },
                {
                  onSuccess: () =>
                    toast.success('DBA 결재를 승인했습니다. 제3자검증중으로 넘어갑니다.'),
                }
              )
            }}
          />
        </PanelCard>
      )}

      <PanelCard title="세부 사항">
        <PanelCardField label="상태">
          <SubtaskStatusControl
            subtask={subtask}
            request={request}
            canTransition={canTransition}
          />
        </PanelCardField>

        <PanelCardField label="상위 이슈">
          <IssueKeyLink to={paths.app.issues.detail.getHref(subtask.parentIssueNo)}>
            {subtask.parentIssueNo}
          </IssueKeyLink>
        </PanelCardField>

        <PanelCardField label="담당자">
          <span className="flex items-center gap-1.5">
            <NameAvatar name={subtask.assignee.name} />
            {subtask.assignee.name}
          </span>
        </PanelCardField>

        <PanelCardField label="이슈유형">{SUBTASK_TYPE_META[subtask.type].label}</PanelCardField>

        <PanelCardField label="목표일">{subtask.dueDate ?? '—'}</PanelCardField>

        {subtask.completedAt && (
          <PanelCardField label="완료일">{subtask.completedAt}</PanelCardField>
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

      {/* Jira Development 패널처럼 — 브랜치가 없으면 생성 액션, 생기면 링크로 대체된다 (1:1) */}
      {subtask.type === 'DEPLOY' && (
        <PanelCard
          title="개발"
          summary={subtask.branch?.branchName}
        >
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
            <CreateBranchDialog subtaskNo={subtask.issueNo} />
          )}
        </PanelCard>
      )}
    </div>
  )
}
