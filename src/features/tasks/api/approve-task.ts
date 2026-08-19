import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { ApprovalKind } from '@/features/tasks/api/types'
import { insertApproval, insertHistory } from '@/features/tasks/api/writers'
import { APPROVAL_KIND_META } from '@/features/tasks/constants/metadata'
import { pushNotification } from '@/shared/lib/notifications'
import { supabase } from '@/shared/lib/supabase'

export type ApproveTaskBody = {
  taskNo: string
  kind: ApprovalKind
  actorName: string
}

/** 결재선 연동 전 임시 승인 (시나리오 각주 2) */
export const approveTaskService = async ({ taskNo, kind, actorName }: ApproveTaskBody) => {
  const { data: current, error: readError } = await supabase
    .from('tasks')
    .select('status, requester_id')
    .eq('task_no', taskNo)
    .single()
  if (readError) throw readError

  const recorded = await insertApproval({ taskNo: taskNo }, kind, actorName)
  if (!recorded) return

  await insertHistory(
    { taskNo: taskNo },
    {
      actorName,
      fromStatus: current.status,
      toStatus: current.status,
      reason: `${APPROVAL_KIND_META[kind].label} 결재 승인`,
    }
  )

  // 결재를 기다리는 사람은 등록자다 — 하나씩 떨어질 때마다 알린다
  await pushNotification({
    recipientId: current.requester_id,
    actorName,
    message: `${taskNo}의 ${APPROVAL_KIND_META[kind].label} 결재를 승인했습니다`,
    taskNo,
  })
}

export const getApproveTaskMutationKey = () => ['/tasks', 'approve'] as const

export function useApproveTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getApproveTaskMutationKey(),
    mutationFn: approveTaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
