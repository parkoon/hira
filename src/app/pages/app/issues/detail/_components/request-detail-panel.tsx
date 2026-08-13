import { toast } from 'sonner'

import { useApproveRequestMutation } from '@/features/issues/api/approve-request'
import type { Request } from '@/features/issues/api/types'
import { ApprovalGate } from '@/features/issues/components/approval-gate'
import { PanelCard, PanelCardField } from '@/features/issues/components/panel-card'
import { PersonalDataLozenge } from '@/features/issues/components/personal-data-lozenge'
import { PriorityLabel } from '@/features/issues/components/priority-label'
import { RequestStatusLozenge } from '@/features/issues/components/request-status-lozenge'
import { APPROVAL_KIND_META } from '@/features/issues/constants/metadata'
import { getDueDateStatus } from '@/features/issues/utils/due-date'
import { getRequiredApprovals } from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { NameAvatar } from '@/shared/components/ui/name-avatar'

/** 우측 컬럼 — 정보만 담는다. 상태 전이는 본문 제목 아래 액션 줄이 맡는다 */
export function RequestDetailPanel({ request }: { request: Request }) {
  const { user } = useCurrentUser()
  const approveRequest = useApproveRequestMutation()

  const due = getDueDateStatus(request.dueDate)
  const requiredApprovals = getRequiredApprovals(request)

  return (
    <div className="space-y-3">
      {/* 승인 전에만 결재를 받는다 — 승인 이후엔 결재 이력을 활동 로그에서 본다 (시나리오 3) */}
      {request.status === 'PENDING_APPROVAL' && requiredApprovals.length > 0 && (
        <PanelCard title="요청 승인 결재">
          <ApprovalGate
            required={requiredApprovals}
            approvals={request.approvals}
            onApprove={(kind) => {
              approveRequest.mutate(
                { issueNo: request.issueNo, kind, actorName: user.name },
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
        <PanelCardField label="상태">
          <RequestStatusLozenge status={request.status} />
        </PanelCardField>

        <PanelCardField label="요청자">
          <span className="flex items-center gap-1.5">
            <NameAvatar name={request.requester.name} />
            {request.requester.name} · {request.requester.dept}
          </span>
        </PanelCardField>

        <PanelCardField label="완료요청일">
          <span className="flex items-center gap-1.5">
            {request.dueDate}
            {request.status !== 'DONE' && <Lozenge tone={due.tone}>{due.label}</Lozenge>}
          </span>
        </PanelCardField>

        <PanelCardField label="우선순위">
          <PriorityLabel priority={request.priority} />
        </PanelCardField>

        <PanelCardField label="컴플라이언스">
          {request.handlesPersonalData || request.consumerProtectionTarget ? (
            <span className="flex flex-wrap items-center gap-1.5">
              {request.handlesPersonalData && <PersonalDataLozenge withIcon />}
              {request.consumerProtectionTarget && (
                <Lozenge tone="warning">소비자보호 대상</Lozenge>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">해당 없음</span>
          )}
        </PanelCardField>
      </PanelCard>

      {/* Jira의 Created/Updated 자리 — 카드 아래 작은 회색 텍스트 */}
      <p className="text-muted-foreground px-1 text-[11px]">
        등록 {request.createdAt}
        {request.submittedAt && <> · 제출 {request.submittedAt}</>}
      </p>
    </div>
  )
}
