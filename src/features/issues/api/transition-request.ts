import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type {
  EvidenceContent,
  RequestStatus,
  StatusHistoryEntry,
} from '@/features/issues/api/types'
import { insertEvidence, insertHistory } from '@/features/issues/api/writers'
import { REQUEST_STATUS_META } from '@/features/issues/constants/metadata'
import { type AuditEventType, recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

/**
 * 감사 이벤트가 정의된 전이만 기록한다 (스펙 §11.4).
 * 회수·인수테스트 요청·인수 확인은 이벤트 목록에 없어 상태 이력에만 남는다.
 */
const AUDIT_EVENT_BY_STATUS: Partial<Record<RequestStatus, AuditEventType>> = {
  PENDING_APPROVAL: 'ISSUE_SUBMIT',
  IN_PROGRESS: 'ISSUE_APPROVE',
  REJECTED: 'ISSUE_REJECT',
  DONE: 'ISSUE_COMPLETE',
}

export type TransitionRequestBody = {
  issueNo: string
  toStatus: RequestStatus
  actorName: string
  reason?: string | null
  via?: StatusHistoryEntry['via']
  /** 단계 완료 시 입력받은 증적 — 전이 직전 상태의 기록으로 남는다 (시나리오 각주 3) */
  evidence?: EvidenceContent
}

export const transitionRequestService = async ({
  issueNo,
  toStatus,
  actorName,
  reason = null,
  via = 'MANUAL',
  evidence,
}: TransitionRequestBody) => {
  const { data: current, error: readError } = await supabase
    .from('requests')
    .select('status')
    .eq('issue_no', issueNo)
    .single()
  if (readError) throw readError

  const { error } = await supabase
    .from('requests')
    .update({
      status: toStatus,
      // 제출 시각은 제출할 때 찍고, 회수하면 지운다 — 임시저장 건에 제출일이 남아 있으면 안 된다.
      // 그 밖의 전이는 기존 값을 건드리지 않는다
      ...(toStatus === 'PENDING_APPROVAL'
        ? { submitted_at: new Date().toISOString() }
        : toStatus === 'DRAFT'
          ? { submitted_at: null }
          : {}),
    })
    .eq('issue_no', issueNo)
  if (error) throw error

  if (evidence !== undefined) {
    await insertEvidence({ requestIssueNo: issueNo }, current.status, evidence, actorName)
  }

  await insertHistory(
    { requestIssueNo: issueNo },
    { actorName, fromStatus: current.status, toStatus, via, reason }
  )

  const auditEvent = AUDIT_EVENT_BY_STATUS[toStatus]
  if (auditEvent) {
    await recordAuditLog({
      actorName,
      eventType: auditEvent,
      targetLabel: issueNo,
      targetIssueNo: issueNo,
      detail: `${REQUEST_STATUS_META[current.status].label} → ${REQUEST_STATUS_META[toStatus].label}`,
    })
  }
}

export const getTransitionRequestMutationKey = () => ['/requests', 'transition'] as const

export function useTransitionRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getTransitionRequestMutationKey(),
    mutationFn: transitionRequestService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
