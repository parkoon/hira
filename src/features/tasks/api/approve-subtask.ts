import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { ApprovalKind } from '@/features/tasks/api/types'
import { insertApproval, insertHistory } from '@/features/tasks/api/writers'
import { APPROVAL_KIND_META, SUBTASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { pushNotification } from '@/shared/lib/notifications'
import { supabase } from '@/shared/lib/supabase'

export type ApproveSubtaskBody = {
  subtaskNo: string
  kind: ApprovalKind
  actorName: string
}

/** DBA 결재 — 떨어지면 작업자 조작 없이 제3자검증중으로 넘어간다 (시나리오 9) */
export const approveSubtaskService = async ({ subtaskNo, kind, actorName }: ApproveSubtaskBody) => {
  const { data: current, error: readError } = await supabase
    .from('subtasks')
    .select('status, parent_task_no, assignee_id')
    .eq('subtask_no', subtaskNo)
    .single()
  if (readError) throw readError

  const recorded = await insertApproval({ subtaskNo: subtaskNo }, kind, actorName)
  const advances = current.status === 'DBA_VERIFICATION'

  // 결재가 이미 기록돼 있어도 전이는 마저 수행한다 — 직전 시도가 결재 기록 후
  // 전이 직전에 실패했다면, 여기서 건너뛰면 '결재 완료 + DBA검증중' 모순 상태에 영구 고착된다
  if (!recorded && !advances) return

  if (advances) {
    const { data: updated, error } = await supabase
      .from('subtasks')
      .update({ status: 'THIRD_PARTY' })
      .eq('subtask_no', subtaskNo)
      .eq('status', 'DBA_VERIFICATION')
      .select('subtask_no')
    if (error) throw error
    // 다른 창에서 이미 넘어갔다 — 중복 이력 없이 종료
    if (updated.length === 0) return
  }

  await insertHistory(
    { subtaskNo: subtaskNo },
    {
      actorName,
      fromStatus: current.status,
      toStatus: advances ? 'THIRD_PARTY' : current.status,
      // 전이 자체는 작업자 조작 없이 일어나므로 자동으로 기록한다 (시나리오 9)
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
      targetTaskNo: current.parent_task_no,
      detail: `${SUBTASK_STATUS_META.DBA_VERIFICATION.label} → ${SUBTASK_STATUS_META.THIRD_PARTY.label} (자동)`,
    })

    // 결재를 기다리며 멈춰 있던 작업자에게 흐름이 다시 움직인 것을 알린다
    if (current.assignee_id !== null) {
      await pushNotification({
        recipientId: current.assignee_id,
        actorName,
        message: `${subtaskNo}의 DBA 결재를 승인했습니다 — 제3자 검증중으로 넘어갑니다`,
        taskNo: current.parent_task_no,
        subtaskNo,
      })
    }
  }
}

export const getApproveSubtaskMutationKey = () => ['/subtasks', 'approve'] as const

export function useApproveSubtaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getApproveSubtaskMutationKey(),
    mutationFn: approveSubtaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
