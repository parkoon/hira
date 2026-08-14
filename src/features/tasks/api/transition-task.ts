import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { EvidenceContent, StatusHistoryEntry, TaskStatus } from '@/features/tasks/api/types'
import { insertEvidence, insertHistory } from '@/features/tasks/api/writers'
import { TASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { AppError } from '@/shared/lib/app-error'
import { type AuditEventType, recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

/**
 * 감사 이벤트가 정의된 전이만 기록한다 (스펙 §11.4).
 * 회수·인수테스트 요청·인수 확인은 이벤트 목록에 없어 상태 이력에만 남는다.
 */
const AUDIT_EVENT_BY_STATUS: Partial<Record<TaskStatus, AuditEventType>> = {
  PENDING_APPROVAL: 'TASK_SUBMIT',
  IN_PROGRESS: 'TASK_APPROVE',
  REJECTED: 'TASK_REJECT',
  DONE: 'TASK_COMPLETE',
}

export type TransitionTaskBody = {
  taskNo: string
  toStatus: TaskStatus
  actorName: string
  reason?: string | null
  via?: StatusHistoryEntry['via']
  /** 단계 완료 시 입력받은 증적 — 전이 직전 상태의 기록으로 남는다 (시나리오 각주 3) */
  evidence?: EvidenceContent
}

export const transitionTaskService = async ({
  taskNo,
  toStatus,
  actorName,
  reason = null,
  via = 'MANUAL',
  evidence,
}: TransitionTaskBody) => {
  const { data: current, error: readError } = await supabase
    .from('tasks')
    .select('status, submitted_at')
    .eq('task_no', taskNo)
    .single()
  if (readError) throw readError

  const { data: updated, error } = await supabase
    .from('tasks')
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
    .eq('task_no', taskNo)
    // 읽어 둔 상태 그대로일 때만 전이한다 — 낡은 화면이 이미 처리된 건을 덮어쓰지 못하고,
    // 거부된 전이의 증적이 남지도 않는다
    .eq('status', current.status)
    .select('task_no')
  if (error) throw error
  if (updated.length === 0) {
    throw new AppError('이미 처리된 요청입니다. 화면을 새로고침해 주세요.')
  }

  if (evidence !== undefined) {
    try {
      await insertEvidence({ taskNo: taskNo }, current.status, evidence, actorName)
    } catch (evidenceError) {
      // 증적 없이 상태만 넘어가면 사후 입력 경로가 없다 — 전이를 되돌려 재시도로 복구되게 한다
      await supabase
        .from('tasks')
        .update({ status: current.status, submitted_at: current.submitted_at })
        .eq('task_no', taskNo)
        .eq('status', toStatus)
      throw evidenceError
    }
  }

  await insertHistory(
    { taskNo: taskNo },
    { actorName, fromStatus: current.status, toStatus, via, reason }
  )

  const auditEvent = AUDIT_EVENT_BY_STATUS[toStatus]
  if (auditEvent) {
    await recordAuditLog({
      actorName,
      eventType: auditEvent,
      targetLabel: taskNo,
      targetTaskNo: taskNo,
      detail: `${TASK_STATUS_META[current.status].label} → ${TASK_STATUS_META[toStatus].label}`,
    })
  }
}

export const getTransitionTaskMutationKey = () => ['/tasks', 'transition'] as const

export function useTransitionTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getTransitionTaskMutationKey(),
    mutationFn: transitionTaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
