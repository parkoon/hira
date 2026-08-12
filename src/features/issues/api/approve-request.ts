import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type { ApprovalKind } from '@/features/issues/api/types'
import { insertApproval, insertHistory } from '@/features/issues/api/writers'
import { APPROVAL_KIND_META } from '@/features/issues/constants/metadata'
import { supabase } from '@/shared/lib/supabase'

export type ApproveRequestBody = {
  issueNo: string
  kind: ApprovalKind
  actorName: string
}

/** 결재선 연동 전 임시 승인 (시나리오 각주 2) */
export const approveRequestService = async ({ issueNo, kind, actorName }: ApproveRequestBody) => {
  const { data: current, error: readError } = await supabase
    .from('requests')
    .select('status')
    .eq('issue_no', issueNo)
    .single()
  if (readError) throw readError

  const recorded = await insertApproval({ requestIssueNo: issueNo }, kind, actorName)
  if (!recorded) return

  await insertHistory(
    { requestIssueNo: issueNo },
    {
      actorName,
      fromStatus: current.status,
      toStatus: current.status,
      reason: `${APPROVAL_KIND_META[kind].label} 결재 승인`,
    }
  )
}

export const getApproveRequestMutationKey = () => ['/requests', 'approve'] as const

export function useApproveRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getApproveRequestMutationKey(),
    mutationFn: approveRequestService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
