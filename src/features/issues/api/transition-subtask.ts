import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type {
  EvidenceContent,
  StatusHistoryEntry,
  SubtaskStatus,
} from '@/features/issues/api/types'
import { insertEvidence, insertHistory } from '@/features/issues/api/writers'
import { SUBTASK_STATUS_META } from '@/features/issues/constants/metadata'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type TransitionSubtaskBody = {
  subtaskNo: string
  toStatus: SubtaskStatus
  actorName: string
  reason?: string | null
  via?: StatusHistoryEntry['via']
  /** 단계 완료 시 입력받은 증적 — 전이 직전 상태의 기록으로 남는다 (시나리오 각주 3) */
  evidence?: EvidenceContent
  /** 개발 완료 전이에서만 함께 확정된다 (시나리오 8) */
  dbaVerificationRequest?: string | null
}

export const transitionSubtaskService = async ({
  subtaskNo,
  toStatus,
  actorName,
  reason = null,
  via = 'MANUAL',
  evidence,
  dbaVerificationRequest,
}: TransitionSubtaskBody) => {
  const { data: current, error: readError } = await supabase
    .from('subtasks')
    .select('status, parent_issue_no')
    .eq('issue_no', subtaskNo)
    .single()
  if (readError) throw readError

  const { error } = await supabase
    .from('subtasks')
    .update({
      status: toStatus,
      // 완료로 갈 때만 채운다. 그 외 전이는 기존 값을 건드리지 않는다 —
      // 무조건 null로 덮으면 되돌리기가 생기는 순간 완료일이 사라진다
      ...(toStatus === 'DONE' ? { completed_at: format(new Date(), 'yyyy-MM-dd') } : {}),
      // 개발 완료에서만 넘어온다. 그 외 전이는 기존 값을 그대로 둔다 (시나리오 8)
      ...(dbaVerificationRequest === undefined
        ? {}
        : { dba_verification_request: dbaVerificationRequest }),
    })
    .eq('issue_no', subtaskNo)
  if (error) throw error

  if (evidence !== undefined) {
    await insertEvidence({ subtaskIssueNo: subtaskNo }, current.status, evidence, actorName)
  }

  await insertHistory(
    { subtaskIssueNo: subtaskNo },
    { actorName, fromStatus: current.status, toStatus, via, reason }
  )

  await recordAuditLog({
    actorName,
    eventType: 'SUBTASK_TRANSITION',
    targetLabel: subtaskNo,
    // 대상 링크는 상위 이슈로 건다 — 하위작업 상세는 부모 번호가 있어야 열린다
    targetIssueNo: current.parent_issue_no,
    detail: `${SUBTASK_STATUS_META[current.status].label} → ${SUBTASK_STATUS_META[toStatus].label} (${
      via === 'API' ? '자동' : '수동'
    })`,
  })
}

export const getTransitionSubtaskMutationKey = () => ['/subtasks', 'transition'] as const

export function useTransitionSubtaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getTransitionSubtaskMutationKey(),
    mutationFn: transitionSubtaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
