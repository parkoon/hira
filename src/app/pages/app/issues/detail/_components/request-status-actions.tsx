import { useState } from 'react'
import { toast } from 'sonner'

import { useTransitionRequestMutation } from '@/features/issues/api/transition-request'
import type { Request } from '@/features/issues/api/types'
import { RejectReasonDialog } from '@/features/issues/components/reject-reason-dialog'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { useConfirm } from '@/shared/hooks/use-confirm'

import { ActionButton } from './action-button'

/**
 * 흐름을 벗어나는 액션만 — 회수·반려. 되돌리기 어려운 액션이라 팝오버에 숨기지 않고
 * 제목 아래 줄에 그대로 둔다. 정방향 진행은 상태 칩의 워크플로 팝오버가 맡는다.
 */
export function RequestStatusActions({ request }: { request: Request }) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const { user, hasRole } = useCurrentUser()
  const confirm = useConfirm()
  const transitionRequest = useTransitionRequestMutation()

  // 회수·반려는 요청승인대기중에만 있다 (시나리오 3)
  if (request.status !== 'PENDING_APPROVAL') return null

  const isLead = hasRole('LEAD')
  const isRequester = request.requester.id === user.id

  const handleWithdraw = () => {
    void confirm
      .open({
        title: `${request.issueNo} 회수`,
        description: '회수하면 요청대기중으로 돌아가 내용을 다시 수정할 수 있습니다.',
        confirm: { text: '회수' },
      })
      .then((ok) => {
        if (!ok) return
        transitionRequest.mutate(
          { issueNo: request.issueNo, toStatus: 'DRAFT', actorName: user.name },
          { onSuccess: () => toast.success(`${request.issueNo} 이슈를 회수했습니다.`) }
        )
      })
  }

  return (
    <>
      {isRequester && (
        <ActionButton
          label="회수"
          pending={transitionRequest.isPending}
          onClick={handleWithdraw}
        />
      )}

      {isLead && (
        <>
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
