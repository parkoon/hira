import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { AppError } from '@/shared/lib/app-error'
import { supabase } from '@/shared/lib/supabase'

export type DeleteSubtaskBody = {
  subtaskNo: string
}

export const deleteSubtaskService = async ({ subtaskNo }: DeleteSubtaskBody) => {
  const { data: deleted, error } = await supabase
    .from('subtasks')
    .delete()
    .eq('subtask_no', subtaskNo)
    // 화면에서도 막지만, 편집 도중 착수된 낡은 화면의 삭제는 여기서 끊는다 —
    // 이력·증적이 CASCADE로 함께 지워지므로 전이·수정 가드보다 더 물러설 수 없다 (스펙 §11.3)
    .eq('status', 'TODO')
    .select('subtask_no')
  if (error) throw error
  if (deleted.length === 0) {
    throw new AppError('이미 시작된 하위작업은 삭제할 수 없습니다. 화면을 새로고침해 주세요.')
  }
}

export const getDeleteSubtaskMutationKey = () => ['/subtasks', 'delete'] as const

export function useDeleteSubtaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getDeleteSubtaskMutationKey(),
    mutationFn: deleteSubtaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
