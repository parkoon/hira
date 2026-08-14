import { useState } from 'react'
import { toast } from 'sonner'

import { useTransitionRequestMutation } from '@/features/issues/api/transition-request'
import type { Request, RequestStatus } from '@/features/issues/api/types'
import { StatusWorkflowPopover } from '@/features/issues/components/status-workflow-popover'
import { TransitionEvidenceDialog } from '@/features/issues/components/transition-evidence-dialog'
import { REQUEST_STATUS_META } from '@/features/issues/constants/metadata'
import { REQUEST_EVIDENCE_HINT } from '@/features/issues/constants/transition-evidence'
import { REQUEST_FLOW } from '@/features/issues/constants/transitions'
import {
  canConfirmAcceptance,
  canSubmitRequest,
  getRequestAdvanceState,
  getRequestApproveState,
} from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { useConfirm } from '@/shared/hooks/use-confirm'

import { ActionButton } from './action-button'
import { CompleteRequestDialog } from './complete-request-dialog'

/** 현재 상태에서 흐름을 한 칸 앞으로 미는 액션. 상태마다 하나뿐이다 */
type ForwardAction = {
  label: string
  /** 있으면 막고 이유를 툴팁으로 보여준다 */
  reason?: string | null
  onClick: () => void
}

/**
 * 상태 칩 + 워크플로 + 정방향 진행. 회수·반려는 흐름을 벗어나는 경로라
 * 제목 아래 액션 줄(`RequestStatusActions`)이 맡는다 — 되돌리기 어려운 액션이 팝오버에 숨으면 안 된다.
 * 팝업들은 팝오버 밖에 둔다 — 안에 두면 팝오버가 닫히며 입력하던 팝업까지 사라진다.
 */
export function RequestStatusControl({ request }: { request: Request }) {
  const [open, setOpen] = useState(false)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const { user, hasRole } = useCurrentUser()
  const confirm = useConfirm()
  const transitionRequest = useTransitionRequestMutation()

  const isLead = hasRole('LEAD')

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

  const resolveForwardAction = (): ForwardAction | null => {
    // 제출 — 요청대기중·반려 상태의 등록자 (시나리오 2)
    if (canSubmitRequest(request, user)) {
      return {
        label: '제출',
        onClick: () =>
          confirmTransition({
            action: '제출',
            description:
              '제출하면 리드가 검토·승인할 수 있게 되고, 그때까지 내용을 수정할 수 없습니다.',
            toStatus: 'PENDING_APPROVAL',
            successMessage: `${request.issueNo} 이슈를 제출했습니다.`,
          }),
      }
    }

    // 승인 — 요청승인대기중의 리드 (시나리오 3)
    if (request.status === 'PENDING_APPROVAL' && isLead) {
      return {
        label: '승인',
        reason: getRequestApproveState(request, user).reason,
        onClick: () =>
          confirmTransition({
            action: '승인',
            description:
              '승인하면 이슈가 작업중으로 전이되고, 이후 이슈 본문·첨부·컴플라이언스 응답은 수정할 수 없습니다.',
            toStatus: 'IN_PROGRESS',
            successMessage: `${request.issueNo} 이슈를 승인했습니다.`,
          }),
      }
    }

    // 인수테스트 요청 — 작업중의 리드 (시나리오 13)
    if (request.status === 'IN_PROGRESS' && isLead) {
      return {
        label: '인수테스트 요청',
        reason: getRequestAdvanceState(request).reason,
        onClick: () =>
          confirmTransition({
            action: '인수테스트 요청',
            description: `${request.issueNo} 이슈가 ${REQUEST_STATUS_META.ACCEPTANCE.label}(으)로 바뀌고, 요청자에게 인수 확인 버튼이 뜹니다.`,
            toStatus: 'ACCEPTANCE',
            successMessage: '인수테스트를 요청했습니다.',
          }),
      }
    }

    // 인수 확인 — 등록자 본인만 (시나리오 14·15)
    if (request.status === 'ACCEPTANCE' && canConfirmAcceptance(request, user)) {
      return { label: '인수 확인', onClick: () => setEvidenceOpen(true) }
    }

    // 최종 완료 — 전 하위작업 완료 후 리드가 (시나리오 19)
    if (request.status === 'DEPLOY_WAITING' && isLead) {
      return {
        label: '최종 완료',
        reason: getRequestAdvanceState(request).reason,
        onClick: () => setCompleteOpen(true),
      }
    }

    return null
  }

  const forward = resolveForwardAction()

  return (
    <>
      <StatusWorkflowPopover
        open={open}
        onOpenChange={setOpen}
        label={REQUEST_STATUS_META[request.status].label}
        steps={REQUEST_FLOW.map((status) => REQUEST_STATUS_META[status].label)}
        currentIndex={REQUEST_FLOW.indexOf(request.status)}
        note={
          request.status === 'REJECTED'
            ? '반려는 이 흐름 밖입니다. 다시 제출하면 요청승인대기중으로 돌아갑니다.'
            : undefined
        }
        action={
          forward && (
            <ActionButton
              fullWidth
              // 팝오버 안에서는 이게 유일한 액션이라 주 버튼으로 둔다 (하위작업 쪽과 같은 모양)
              variant="default"
              label={forward.label}
              reason={forward.reason}
              pending={transitionRequest.isPending}
              onClick={() => {
                setOpen(false)
                forward.onClick()
              }}
            />
          )
        }
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
