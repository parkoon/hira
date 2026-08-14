import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { supabase } from '@/shared/lib/supabase'

export type RecordSubtaskBranchBody = {
  subtaskNo: string
  repoFullName: string
  branchName: string
  branchUrl: string
  actorName: string
}

/** Gitea에 브랜치를 만든 뒤 그 기록을 남긴다 — 개발 패널이 링크로 보여준다 */
export const recordSubtaskBranchService = async ({
  subtaskNo,
  repoFullName,
  branchName,
  branchUrl,
  actorName,
}: RecordSubtaskBranchBody) => {
  const { error } = await supabase.from('subtask_branches').insert({
    subtask_no: subtaskNo,
    repo_full_name: repoFullName,
    branch_name: branchName,
    branch_url: branchUrl,
    created_by: actorName,
  })
  if (error) throw error
}

export const getRecordSubtaskBranchMutationKey = () => ['/subtasks/branches', 'post'] as const

export function useRecordSubtaskBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getRecordSubtaskBranchMutationKey(),
    mutationFn: recordSubtaskBranchService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
