import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { StatusHistoryEntry, TaskStatus } from '@/features/tasks/api/types'
import { insertHistory } from '@/features/tasks/api/writers'
import { TASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { AppError } from '@/shared/lib/app-error'
import { type AuditEventType, recordAuditLog } from '@/shared/lib/audit-log'
import { pushNotification } from '@/shared/lib/notifications'
import { supabase } from '@/shared/lib/supabase'

/**
 * 감사 이벤트가 정의된 전이만 기록한다 (스펙 §11.4).
 * 회수는 이벤트 목록에 없어 상태 이력에만 남는다.
 */
const AUDIT_EVENT_BY_STATUS: Partial<Record<TaskStatus, AuditEventType>> = {
  PENDING_APPROVAL: 'TASK_SUBMIT',
  IN_PROGRESS: 'TASK_APPROVE',
  REJECTED: 'TASK_REJECT',
  DONE: 'TASK_COMPLETE',
}

/**
 * 등록자에게 알리는 전이 — 남이 내 작업을 움직인 결과다.
 * 제출·회수는 등록자 본인의 조작이라 알릴 사람이 없다.
 */
const NOTIFY_MESSAGE_BY_STATUS: Partial<Record<TaskStatus, string>> = {
  IN_PROGRESS: '작업을 승인했습니다',
  REJECTED: '작업을 반려했습니다',
  DONE: '작업을 최종 완료했습니다',
}

export type TransitionTaskBody = {
  taskNo: string
  toStatus: TaskStatus
  actorName: string
  reason?: string | null
  via?: StatusHistoryEntry['via']
}

export const transitionTaskService = async ({
  taskNo,
  toStatus,
  actorName,
  reason = null,
  via = 'MANUAL',
}: TransitionTaskBody) => {
  const { data: current, error: readError } = await supabase
    .from('tasks')
    .select('status, requester_id')
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

  const notifyMessage = NOTIFY_MESSAGE_BY_STATUS[toStatus]
  if (notifyMessage) {
    await pushNotification({
      recipientId: current.requester_id,
      actorName,
      message: `${taskNo} ${notifyMessage}`,
      taskNo,
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
