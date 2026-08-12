import { ExternalLinkIcon, GitBranchIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useApproveSubtaskMutation } from '@/features/issues/api/approve-subtask'
import type { IssueActor, Request, Subtask } from '@/features/issues/api/types'
import { ApprovalGate } from '@/features/issues/components/approval-gate'
import { IssueKeyLink } from '@/features/issues/components/issue-key-link'
import { PanelCard, PanelCardField } from '@/features/issues/components/panel-card'
import { SUBTASK_STATUS_META, SUBTASK_TYPE_META } from '@/features/issues/constants/metadata'
import { getSubtaskStep } from '@/features/issues/constants/transitions'
import { getDeploymentUrl, getSubtaskApprovalState } from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { paths } from '@/shared/config/paths'

import { AssigneeMenu } from './assignee-menu'
import { CreateBranchDialog } from './create-branch-dialog'
import { SubtaskStatusChip } from './subtask-status-chip'
import { SubtaskStepper } from './subtask-stepper'
import { SubtaskTransitionActions } from './subtask-transition-actions'

type SubtaskDetailPanelProps = {
  subtask: Subtask
  request: Request
  /** 전이는 담당자·리드만 가능 (스펙 §5.3) */
  canTransition: boolean
  /** 담당자 배정·변경 가능 여부 */
  canReassign: boolean
  onReassign: (assignee: IssueActor) => void
}

/** 우측 컬럼 — Jira 이슈 뷰처럼 상태(전이) 버튼, 결재, 세부 사항, 진행 단계 카드 순서 */
export function SubtaskDetailPanel({
  subtask,
  request,
  canTransition,
  canReassign,
  onReassign,
}: SubtaskDetailPanelProps) {
  const { user } = useCurrentUser()
  const approveSubtask = useApproveSubtaskMutation()

  const deploymentUrl = getDeploymentUrl(subtask)
  const { step, total } = getSubtaskStep(subtask)
  const requiredApprovals = getSubtaskApprovalState(subtask).required

  return (
    <div className="space-y-3">
      {/* Jira처럼 상태는 카드 밖 최상단 — 하위작업은 순차 전진뿐이라 전진 버튼이 전이를 맡는다 */}
      <div className="flex flex-wrap items-center gap-2">
        <SubtaskStatusChip status={subtask.status} />
        <SubtaskTransitionActions
          subtask={subtask}
          request={request}
          canTransition={canTransition}
        />
      </div>

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
        <PanelCardField label="상위 이슈">
          <IssueKeyLink to={paths.app.issues.detail.getHref(subtask.parentIssueNo)}>
            {subtask.parentIssueNo}
          </IssueKeyLink>
        </PanelCardField>

        <PanelCardField label="담당자">
          <span className="flex items-center gap-1.5">
            <NameAvatar name={subtask.assignee.name} />
            {subtask.assignee.name}
            {canReassign && (
              <AssigneeMenu
                assignee={subtask.assignee}
                onChange={onReassign}
              />
            )}
          </span>
        </PanelCardField>

        <PanelCardField label="이슈유형">
          <Lozenge tone={SUBTASK_TYPE_META[subtask.type].tone}>
            {SUBTASK_TYPE_META[subtask.type].label}
          </Lozenge>
        </PanelCardField>

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

      {/* Jira 'More fields' 자리 — 접으면 헤더 요약으로 현재 위치를 알린다 */}
      <PanelCard
        title="진행 단계"
        summary={`${step}/${total} · ${SUBTASK_STATUS_META[subtask.status].label}`}
      >
        <SubtaskStepper subtask={subtask} />
      </PanelCard>
    </div>
  )
}
