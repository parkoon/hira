import { useSuspenseQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { getRequestsQueryOptions } from '@/features/issues/api/get-requests'
import { useTransitionRequestMutation } from '@/features/issues/api/transition-request'
import type { Request } from '@/features/issues/api/types'
import { RejectReasonDialog } from '@/features/issues/components/reject-reason-dialog'
import {
  getRequestApproveState,
  selectPendingApprovalRequests,
} from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Page } from '@/shared/components/ui/layout/page'
import { useConfirm } from '@/shared/hooks/use-confirm'

import { ApprovalFilters } from './_components/approval-filters'
import { ApprovalsTable } from './_components/approvals-table'
import { applyApprovalFilters, approvalFilterParsers } from './_utils/approval-filters'

/** 화면 5 — 승인 대기함 (리드 이상, 스펙 §6-5) */
function ApprovalInboxPage() {
  const { user } = useCurrentUser()
  const confirm = useConfirm()
  const [rejectTarget, setRejectTarget] = useState<Request | null>(null)
  const [filters] = useQueryStates(approvalFilterParsers)

  const requestsQuery = useSuspenseQuery(getRequestsQueryOptions())
  const transitionRequest = useTransitionRequestMutation()

  const pendingRequests = useMemo(
    () => selectPendingApprovalRequests(requestsQuery.data),
    [requestsQuery.data]
  )
  const requesters = useMemo(
    () => [...new Set(pendingRequests.map((request) => request.requester.name))],
    [pendingRequests]
  )
  const requests = useMemo(
    () => applyApprovalFilters(pendingRequests, filters),
    [pendingRequests, filters]
  )

  const isSelfRegistered = useCallback(
    (request: Request) => request.requester.name === user.name,
    [user.name]
  )

  const getApproveState = useCallback(
    (request: Request) => getRequestApproveState(request, user),
    [user]
  )

  const handleApprove = useCallback(
    (request: Request) => {
      void confirm
        .open({
          title: `${request.issueNo} 승인`,
          description:
            '승인하면 이슈가 작업중으로 전이되고, 이후 이슈 본문·첨부·컴플라이언스 응답은 수정할 수 없습니다.',
          confirm: { text: '승인' },
        })
        .then((ok) => {
          if (!ok) return
          transitionRequest.mutate(
            { issueNo: request.issueNo, toStatus: 'IN_PROGRESS', actorName: user.name },
            { onSuccess: () => toast.success(`${request.issueNo} 이슈를 승인했습니다.`) }
          )
        })
    },
    [confirm, transitionRequest, user.name]
  )

  const handleReject = useCallback((request: Request) => setRejectTarget(request), [])

  return (
    <Page
      className="overflow-y-hidden"
      noContentPadding
    >
      <div className="mb-3 px-2 pt-2">
        <p className="text-muted-foreground mb-2 text-xs">
          개인정보 취급 건은 강조 표시됩니다. 본인이 등록한 이슈는 직접 승인·반려할 수 없습니다.
        </p>
        <ApprovalFilters requesters={requesters} />
      </div>

      <ApprovalsTable
        requests={requests}
        isSelfRegistered={isSelfRegistered}
        getApproveState={getApproveState}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <RejectReasonDialog
        request={rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onConfirm={(reason) => {
          if (!rejectTarget) return
          transitionRequest.mutate(
            { issueNo: rejectTarget.issueNo, toStatus: 'REJECTED', actorName: user.name, reason },
            { onSuccess: () => toast.success(`${rejectTarget.issueNo} 이슈를 반려했습니다.`) }
          )
        }}
      />
    </Page>
  )
}

export { ApprovalInboxPage as Component }
