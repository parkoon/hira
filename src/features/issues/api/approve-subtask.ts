import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type { ApprovalKind } from '@/features/issues/api/types'
import { insertApproval, insertHistory } from '@/features/issues/api/writers'
import { APPROVAL_KIND_META } from '@/features/issues/constants/metadata'
import { supabase } from '@/shared/lib/supabase'

export type ApproveSubtaskBody = {
  subtaskNo: string
  kind: ApprovalKind
  actorName: string
}

/** DBA 결재 — 떨어지면 담당자 조작 없이 제3자검증중으로 넘어간다 (시나리오 9) */
export const approveSubtaskService = async ({ subtaskNo, kind, actorName }: ApproveSubtaskBody) => {
  const { data: current, error: readError } = await supabase
    .from('subtasks')
    .select('status')
    .eq('issue_no', subtaskNo)
    .single()
  if (readError) throw readError

  const recorded = await insertApproval({ subtaskIssueNo: subtaskNo }, kind, actorName)
  if (!recorded) return

  const advances = current.status === 'DBA_VERIFICATION'

  if (advances) {
    const { error } = await supabase
      .from('subtasks')
      .update({ status: 'THIRD_PARTY' })
      .eq('issue_no', subtaskNo)
    if (error) throw error
  }

  await insertHistory(
    { subtaskIssueNo: subtaskNo },
    {
      actorName,
      fromStatus: current.status,
      toStatus: advances ? 'THIRD_PARTY' : current.status,
      reason: `${APPROVAL_KIND_META[kind].label} 결재 승인`,
    }
  )
}

export const getApproveSubtaskMutationKey = () => ['/subtasks', 'approve'] as const

export function useApproveSubtaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getApproveSubtaskMutationKey(),
    mutationFn: approveSubtaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
