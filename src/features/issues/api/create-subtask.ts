import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type { SubtaskDraft } from '@/features/issues/api/types'
import { insertHistory, resolveProfileIdByName } from '@/features/issues/api/writers'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type CreateSubtaskBody = {
  parentIssueNo: string
  draft: SubtaskDraft
  actorName: string
}

/** 부모 번호 기반 채번 (스펙 §5.1). 남아 있는 번호 중 최대값 다음을 쓴다. */
async function nextSubtaskNo(parentIssueNo: string) {
  const { data, error } = await supabase
    .from('subtasks')
    .select('issue_no')
    .eq('parent_issue_no', parentIssueNo)
    .order('issue_no', { ascending: false })
    .limit(1)
  if (error) throw error

  const lastSequence =
    data.length === 0 ? 0 : Number(data[0].issue_no.slice(parentIssueNo.length + 1))
  const next = Number.isNaN(lastSequence) ? 1 : lastSequence + 1
  return `${parentIssueNo}-${String(next).padStart(2, '0')}`
}

export const createSubtaskService = async ({
  parentIssueNo,
  draft,
  actorName,
}: CreateSubtaskBody) => {
  const [issueNo, assigneeId] = await Promise.all([
    nextSubtaskNo(parentIssueNo),
    resolveProfileIdByName(draft.assignee.name),
  ])

  const { error } = await supabase.from('subtasks').insert({
    issue_no: issueNo,
    parent_issue_no: parentIssueNo,
    type: draft.type,
    title: draft.title,
    description: draft.description,
    status: 'TODO',
    assignee_id: assigneeId,
    due_date: draft.dueDate,
  })
  if (error) throw error

  const { data: parent, error: parentError } = await supabase
    .from('requests')
    .select('status')
    .eq('issue_no', parentIssueNo)
    .single()
  if (parentError) throw parentError

  // 하위작업 생성은 부모의 활동으로 남는다
  await insertHistory(
    { requestIssueNo: parentIssueNo },
    {
      actorName,
      fromStatus: parent.status,
      toStatus: parent.status,
      reason: `하위작업 생성 · ${issueNo} ${draft.title}`,
    }
  )

  await recordAuditLog({
    actorName,
    eventType: 'SUBTASK_CREATE',
    targetLabel: issueNo,
    targetIssueNo: parentIssueNo,
    detail: `${draft.title} · 담당 ${draft.assignee.name}`,
  })
}

export const getCreateSubtaskMutationKey = () => ['/subtasks', 'create'] as const

export function useCreateSubtaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getCreateSubtaskMutationKey(),
    mutationFn: createSubtaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
