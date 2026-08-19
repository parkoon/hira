import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { AppError } from '@/shared/lib/app-error'
import { supabase } from '@/shared/lib/supabase'

export type UpdateCommentBody = {
  id: number
  body: string
  /** 본인 댓글만 고칠 수 있다 — 화면에서도 막지만 저장 시 한 번 더 판별한다 */
  authorId: string
}

export const updateCommentService = async ({ id, body, authorId }: UpdateCommentBody) => {
  const { data: updated, error } = await supabase
    .from('comments')
    .update({ body })
    .eq('id', id)
    .eq('author_id', authorId)
    .select('id')
  if (error) throw error
  if (updated.length === 0) {
    throw new AppError('댓글을 수정할 수 없습니다. 화면을 새로고침해 주세요.')
  }
}

export const getUpdateCommentMutationKey = () => ['/comments', 'update'] as const

export function useUpdateCommentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getUpdateCommentMutationKey(),
    mutationFn: updateCommentService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
