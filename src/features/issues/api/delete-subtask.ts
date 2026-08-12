import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import { supabase } from '@/shared/lib/supabase'

export type DeleteSubtaskBody = {
  subtaskNo: string
}

export const deleteSubtaskService = async ({ subtaskNo }: DeleteSubtaskBody) => {
  const { error } = await supabase.from('subtasks').delete().eq('issue_no', subtaskNo)
  if (error) throw error
}

export const getDeleteSubtaskMutationKey = () => ['/subtasks', 'delete'] as const

export function useDeleteSubtaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getDeleteSubtaskMutationKey(),
    mutationFn: deleteSubtaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
