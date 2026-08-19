import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { AppError } from '@/shared/lib/app-error'
import { supabase } from '@/shared/lib/supabase'

export type DeleteCommentBody = {
  id: number
  /** 본인 댓글만 지울 수 있다 — 화면에서도 막지만 삭제 시 한 번 더 판별한다 */
  authorId: string
}

export const deleteCommentService = async ({ id, authorId }: DeleteCommentBody) => {
  const { data: deleted, error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('author_id', authorId)
    .select('id')
  if (error) throw error
  if (deleted.length === 0) {
    throw new AppError('이미 삭제된 댓글입니다. 화면을 새로고침해 주세요.')
  }
}

export const getDeleteCommentMutationKey = () => ['/comments', 'delete'] as const

export function useDeleteCommentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getDeleteCommentMutationKey(),
    mutationFn: deleteCommentService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
