import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type { ApprovalKind } from '@/features/issues/api/types'
import { insertApproval, insertHistory } from '@/features/issues/api/writers'
import { APPROVAL_KIND_META, SUBTASK_STATUS_META } from '@/features/issues/constants/metadata'
import { recordAuditLog } from '@/shared/lib/audit-log'
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
    .select('status, parent_issue_no')
    .eq('issue_no', subtaskNo)
    .single()
  if (readError) throw readError

  const recorded = await insertApproval({ subtaskIssueNo: subtaskNo }, kind, actorName)
  const advances = current.status === 'DBA_VERIFICATION'

  // 결재가 이미 기록돼 있어도 전이는 마저 수행한다 — 직전 시도가 결재 기록 후
  // 전이 직전에 실패했다면, 여기서 건너뛰면 '결재 완료 + DBA검증중' 모순 상태에 영구 고착된다
  if (!recorded && !advances) return

  if (advances) {
    const { data: updated, error } = await supabase
      .from('subtasks')
      .update({ status: 'THIRD_PARTY' })
      .eq('issue_no', subtaskNo)
      .eq('status', 'DBA_VERIFICATION')
      .select('issue_no')
    if (error) throw error
    // 다른 창에서 이미 넘어갔다 — 중복 이력 없이 종료
    if (updated.length === 0) return
  }

  await insertHistory(
    { subtaskIssueNo: subtaskNo },
    {
      actorName,
      fromStatus: current.status,
      toStatus: advances ? 'THIRD_PARTY' : current.status,
      // 전이 자체는 담당자 조작 없이 일어나므로 자동으로 기록한다 (시나리오 9)
      via: advances ? 'API' : 'MANUAL',
      reason: `${APPROVAL_KIND_META[kind].label} 결재 승인`,
    }
  )

  // 자동 전이도 다른 전이와 똑같이 감사 로그에 남긴다 (스펙 §11.4)
  if (advances) {
    await recordAuditLog({
      actorName,
      eventType: 'SUBTASK_TRANSITION',
      targetLabel: subtaskNo,
      targetIssueNo: current.parent_issue_no,
      detail: `${SUBTASK_STATUS_META.DBA_VERIFICATION.label} → ${SUBTASK_STATUS_META.THIRD_PARTY.label} (자동)`,
    })
  }
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
