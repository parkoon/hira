import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { type ActivityOwner, ownerColumns } from '@/features/tasks/api/writers'
import { supabase } from '@/shared/lib/supabase'

export type CreateCommentBody = {
  owner: ActivityOwner
  body: string
  authorId: string
}

export const createCommentService = async ({ owner, body, authorId }: CreateCommentBody) => {
  const { error } = await supabase.from('comments').insert({
    ...ownerColumns(owner),
    author_id: authorId,
    body,
  })
  if (error) throw error
}

export const getCreateCommentMutationKey = () => ['/comments', 'create'] as const

export function useCreateCommentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getCreateCommentMutationKey(),
    mutationFn: createCommentService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
