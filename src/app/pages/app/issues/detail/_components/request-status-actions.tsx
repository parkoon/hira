import { useState } from 'react'
import { toast } from 'sonner'

import { useTransitionRequestMutation } from '@/features/issues/api/transition-request'
import type { Request, RequestStatus } from '@/features/issues/api/types'
import { RejectReasonDialog } from '@/features/issues/components/reject-reason-dialog'
import { TransitionEvidenceDialog } from '@/features/issues/components/transition-evidence-dialog'
import { REQUEST_STATUS_META } from '@/features/issues/constants/metadata'
import { REQUEST_EVIDENCE_HINT } from '@/features/issues/constants/transition-evidence'
import {
  canConfirmAcceptance,
  canSubmitRequest,
  getRequestAdvanceState,
  getRequestApproveState,
} from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useConfirm } from '@/shared/hooks/use-confirm'

import { CompleteRequestDialog } from './complete-request-dialog'

/** 사유 툴팁이 필요한 disabled 버튼 패턴 */
function ActionButton({
  label,
  reason,
  pending = false,
  variant = 'default',
  onClick,
}: {
  label: string
  /** 있으면 버튼을 막고 이유를 툴팁으로 보여준다 */
  reason?: string | null
  /** 전이 진행 중 — 재클릭하면 이력·감사 로그가 중복으로 쌓인다 */
  pending?: boolean
  variant?: 'default' | 'outline' | 'destructive'
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block">
          <Button
            variant={variant}
            disabled={Boolean(reason) || pending}
            onClick={onClick}
          >
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      {reason && <TooltipContent>{reason}</TooltipContent>}
    </Tooltip>
  )
}

/**
 * 상태별 액션 버튼 행 — 모든 상태 전이는 여기서 일어난다 (칩은 표시 전용).
 * 보이는 버튼이 곧 역할별 권한이다: 제출·회수·인수 확인은 등록자, 승인·반려·진행은 리드.
 */
export function RequestStatusActions({ request }: { request: Request }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const { user, hasRole } = useCurrentUser()
  const confirm = useConfirm()
  const transitionRequest = useTransitionRequestMutation()

  const isLead = hasRole('LEAD')
  const isRequester = request.requester.id === user.id

  /** confirm을 거쳐 전이한다 — 모든 상태변화에 확인 팝업 (시나리오 각주 1) */
  const confirmTransition = (input: {
    action: string
    description: string
    toStatus: RequestStatus
    successMessage: string
  }) => {
    void confirm
      .open({
        title: `${request.issueNo} ${input.action}`,
        description: input.description,
        confirm: { text: input.action },
      })
      .then((ok) => {
        if (!ok) return
        transitionRequest.mutate(
          { issueNo: request.issueNo, toStatus: input.toStatus, actorName: user.name },
          { onSuccess: () => toast.success(input.successMessage) }
        )
      })
  }

  // 제출 — 요청대기중·반려 상태의 등록자 (시나리오 2)
  if (canSubmitRequest(request, user)) {
    return (
      <ActionButton
        label="제출"
        pending={transitionRequest.isPending}
        onClick={() =>
          confirmTransition({
            action: '제출',
            description:
              '제출하면 리드가 검토·승인할 수 있게 되고, 그때까지 내용을 수정할 수 없습니다.',
            toStatus: 'PENDING_APPROVAL',
            successMessage: `${request.issueNo} 이슈를 제출했습니다.`,
          })
        }
      />
    )
  }

  // 요청승인대기중 — 등록자는 회수, 리드는 승인·반려 (시나리오 3)
  if (request.status === 'PENDING_APPROVAL') {
    const approveState = getRequestApproveState(request, user)

    return (
      <>
        {isRequester && (
          <ActionButton
            label="회수"
            variant="outline"
            pending={transitionRequest.isPending}
            onClick={() =>
              confirmTransition({
                action: '회수',
                description: '회수하면 요청대기중으로 돌아가 내용을 다시 수정할 수 있습니다.',
                toStatus: 'DRAFT',
                successMessage: `${request.issueNo} 이슈를 회수했습니다.`,
              })
            }
          />
        )}

        {isLead && (
          <>
            <ActionButton
              label="승인"
              reason={approveState.reason}
              pending={transitionRequest.isPending}
              onClick={() =>
                confirmTransition({
                  action: '승인',
                  description:
                    '승인하면 이슈가 작업중으로 전이되고, 이후 이슈 본문·첨부·컴플라이언스 응답은 수정할 수 없습니다.',
                  toStatus: 'IN_PROGRESS',
                  successMessage: `${request.issueNo} 이슈를 승인했습니다.`,
                })
              }
            />
            <ActionButton
              label="반려"
              variant="destructive"
              reason={isRequester ? '본인이 등록한 이슈는 직접 반려할 수 없어요' : null}
              pending={transitionRequest.isPending}
              onClick={() => setRejectOpen(true)}
            />

            <RejectReasonDialog
              request={rejectOpen ? request : null}
              onOpenChange={(open) => !open && setRejectOpen(false)}
              onConfirm={(reason) => {
                transitionRequest.mutate(
                  { issueNo: request.issueNo, toStatus: 'REJECTED', actorName: user.name, reason },
                  { onSuccess: () => toast.success(`${request.issueNo} 이슈를 반려했습니다.`) }
                )
              }}
            />
          </>
        )}
      </>
    )
  }

  // 작업중 — 리드가 인수테스트를 요청한다 (시나리오 13)
  if (request.status === 'IN_PROGRESS' && isLead) {
    const advance = getRequestAdvanceState(request)

    return (
      <ActionButton
        label="인수테스트 요청"
        reason={advance.reason}
        pending={transitionRequest.isPending}
        onClick={() =>
          confirmTransition({
            action: '인수테스트 요청',
            description: `${request.issueNo} 이슈가 ${REQUEST_STATUS_META.ACCEPTANCE.label}(으)로 바뀌고, 요청자에게 인수 확인 버튼이 뜹니다.`,
            toStatus: 'ACCEPTANCE',
            successMessage: '인수테스트를 요청했습니다.',
          })
        }
      />
    )
  }

  // 인수테스트중 — 등록자 본인만 확인한다 (시나리오 14·15)
  if (request.status === 'ACCEPTANCE' && canConfirmAcceptance(request, user)) {
    return (
      <>
        <ActionButton
          label="인수 확인"
          pending={transitionRequest.isPending}
          onClick={() => setEvidenceOpen(true)}
        />

        {/* 열릴 때만 마운트한다 — 취소 후 다시 열면 빈 입력으로 시작해야 한다 */}
        {evidenceOpen && (
          <TransitionEvidenceDialog
            open
            title="인수 확인"
            hint={REQUEST_EVIDENCE_HINT.ACCEPTANCE ?? ''}
            outcome={REQUEST_STATUS_META.DEPLOY_WAITING.label}
            confirmLabel="인수 확인"
            confirmDisabled={transitionRequest.isPending}
            onOpenChange={setEvidenceOpen}
            onConfirm={(evidence) => {
              transitionRequest.mutate(
                {
                  issueNo: request.issueNo,
                  toStatus: 'DEPLOY_WAITING',
                  actorName: user.name,
                  evidence,
                },
                {
                  onSuccess: () =>
                    toast.success('인수 확인을 마쳤습니다. 이제 하위작업을 이행할 수 있어요.'),
                }
              )
            }}
          />
        )}
      </>
    )
  }

  // 이행대기중 — 전 하위작업 완료 후 리드가 최종 완료한다 (시나리오 19)
  if (request.status === 'DEPLOY_WAITING' && isLead) {
    const advance = getRequestAdvanceState(request)

    return (
      <>
        <ActionButton
          label="최종 완료"
          reason={advance.reason}
          pending={transitionRequest.isPending}
          onClick={() => setCompleteOpen(true)}
        />

        <CompleteRequestDialog
          request={request}
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          onConfirm={() => {
            transitionRequest.mutate(
              { issueNo: request.issueNo, toStatus: 'DONE', actorName: user.name },
              { onSuccess: () => toast.success(`${request.issueNo} 이슈를 최종 완료했습니다.`) }
            )
          }}
        />
      </>
    )
  }

  return null
}
