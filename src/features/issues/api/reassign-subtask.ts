import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type { IssueActor } from '@/features/issues/api/types'
import { supabase } from '@/shared/lib/supabase'

export type ReassignSubtaskBody = {
  subtaskNo: string
  assignee: IssueActor
}

export const reassignSubtaskService = async ({ subtaskNo, assignee }: ReassignSubtaskBody) => {
  const { error } = await supabase
    .from('subtasks')
    .update({ assignee_id: assignee.id })
    .eq('issue_no', subtaskNo)
  if (error) throw error
}

export const getReassignSubtaskMutationKey = () => ['/subtasks', 'reassign'] as const

export function useReassignSubtaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getReassignSubtaskMutationKey(),
    mutationFn: reassignSubtaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
