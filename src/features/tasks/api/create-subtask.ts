import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { SubtaskDraft } from '@/features/tasks/api/types'
import { insertHistory } from '@/features/tasks/api/writers'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { pushNotification } from '@/shared/lib/notifications'
import { supabase } from '@/shared/lib/supabase'

export type CreateSubtaskBody = {
  parentTaskNo: string
  draft: SubtaskDraft
  actorName: string
}

/** 부모 번호 기반 채번 (스펙 §5.1). 남아 있는 번호 중 최대값 다음을 쓴다. */
async function nextSubtaskNo(parentTaskNo: string) {
  const { data, error } = await supabase
    .from('subtasks')
    .select('subtask_no')
    .eq('parent_task_no', parentTaskNo)
    .order('subtask_no', { ascending: false })
    .limit(1)
  if (error) throw error

  const lastSequence =
    data.length === 0 ? 0 : Number(data[0].subtask_no.slice(parentTaskNo.length + 1))
  const next = Number.isNaN(lastSequence) ? 1 : lastSequence + 1
  return `${parentTaskNo}-${String(next).padStart(2, '0')}`
}

export const createSubtaskService = async ({
  parentTaskNo,
  draft,
  actorName,
}: CreateSubtaskBody) => {
  const subtaskNo = await nextSubtaskNo(parentTaskNo)

  const { error } = await supabase.from('subtasks').insert({
    subtask_no: subtaskNo,
    parent_task_no: parentTaskNo,
    type: draft.type,
    title: draft.title,
    description: draft.description,
    status: 'TODO',
    assignee_id: draft.assignee.id,
    due_date: draft.dueDate,
  })
  if (error) throw error

  const { data: parent, error: parentError } = await supabase
    .from('tasks')
    .select('status')
    .eq('task_no', parentTaskNo)
    .single()
  if (parentError) throw parentError

  // 하위작업 생성은 부모의 활동으로 남는다
  await insertHistory(
    { taskNo: parentTaskNo },
    {
      actorName,
      fromStatus: parent.status,
      toStatus: parent.status,
      reason: `하위작업 생성 · ${subtaskNo} ${draft.title}`,
    }
  )

  await recordAuditLog({
    actorName,
    eventType: 'SUBTASK_CREATE',
    targetLabel: subtaskNo,
    targetTaskNo: parentTaskNo,
    detail: `${draft.title} · 담당 ${draft.assignee.name}`,
  })

  // 배정받은 작업자에게 알린다 — 본인이 만들어 본인이 맡는 경우는 헬퍼가 거른다
  await pushNotification({
    recipientId: draft.assignee.id,
    actorName,
    message: `${subtaskNo} 하위작업을 배정했습니다`,
    taskNo: parentTaskNo,
    subtaskNo,
  })
}

export const getCreateSubtaskMutationKey = () => ['/subtasks', 'create'] as const

export function useCreateSubtaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getCreateSubtaskMutationKey(),
    mutationFn: createSubtaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
