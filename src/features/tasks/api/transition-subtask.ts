import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { EvidenceContent, StatusHistoryEntry, SubtaskStatus } from '@/features/tasks/api/types'
import { insertEvidence, insertHistory } from '@/features/tasks/api/writers'
import { SUBTASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { AppError } from '@/shared/lib/app-error'
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
    .select('status, parent_task_no, completed_at, dba_verification_request')
    .eq('subtask_no', subtaskNo)
    .single()
  if (readError) throw readError

  const { data: updated, error } = await supabase
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
    .eq('subtask_no', subtaskNo)
    // 읽어 둔 상태 그대로일 때만 전이한다 — 낡은 화면의 역행 전이를 막고,
    // 거부된 전이의 증적이 남지도 않는다
    .eq('status', current.status)
    .select('subtask_no')
  if (error) throw error
  if (updated.length === 0) {
    throw new AppError('이미 처리된 작업입니다. 화면을 새로고침해 주세요.')
  }

  if (evidence !== undefined) {
    try {
      await insertEvidence({ subtaskNo: subtaskNo }, current.status, evidence, actorName)
    } catch (evidenceError) {
      // 증적 없이 상태만 넘어가면 사후 입력 경로가 없다 — 전이를 되돌려 재시도로 복구되게 한다
      await supabase
        .from('subtasks')
        .update({
          status: current.status,
          completed_at: current.completed_at,
          dba_verification_request: current.dba_verification_request,
        })
        .eq('subtask_no', subtaskNo)
        .eq('status', toStatus)
      throw evidenceError
    }
  }

  await insertHistory(
    { subtaskNo: subtaskNo },
    { actorName, fromStatus: current.status, toStatus, via, reason }
  )

  await recordAuditLog({
    actorName,
    eventType: 'SUBTASK_TRANSITION',
    targetLabel: subtaskNo,
    // 대상 링크는 상위 작업으로 건다 — 하위작업 상세는 부모 번호가 있어야 열린다
    targetTaskNo: current.parent_task_no,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
