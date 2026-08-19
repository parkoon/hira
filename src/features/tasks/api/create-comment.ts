import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { type ActivityOwner, ownerColumns } from '@/features/tasks/api/writers'
import { pushNotification } from '@/shared/lib/notifications'
import { supabase } from '@/shared/lib/supabase'

export type CreateCommentBody = {
  owner: ActivityOwner
  body: string
  authorId: string
  /** 알림 문장에 넣을 작성자 이름 — 수신자 화면이 다시 조회하지 않게 함께 남긴다 */
  authorName: string
}

export const createCommentService = async ({
  owner,
  body,
  authorId,
  authorName,
}: CreateCommentBody) => {
  const { error } = await supabase.from('comments').insert({
    ...ownerColumns(owner),
    author_id: authorId,
    body,
  })
  if (error) throw error

  // 대화 상대에게 알린다 — 작업 댓글은 등록자, 하위작업 댓글은 작업자.
  // 본인 레코드에 단 본인 댓글은 헬퍼가 거른다
  const snippet = body.replace(/\s+/g, ' ').trim()
  const preview = snippet.length > 40 ? `${snippet.slice(0, 40)}…` : snippet

  if ('taskNo' in owner) {
    const { data } = await supabase
      .from('tasks')
      .select('requester_id')
      .eq('task_no', owner.taskNo)
      .maybeSingle()
    if (data) {
      await pushNotification({
        recipientId: data.requester_id,
        actorName: authorName,
        message: `${owner.taskNo}에 댓글을 남겼습니다: "${preview}"`,
        taskNo: owner.taskNo,
      })
    }
    return
  }

  const { data } = await supabase
    .from('subtasks')
    .select('assignee_id, parent_task_no')
    .eq('subtask_no', owner.subtaskNo)
    .maybeSingle()
  if (data && data.assignee_id !== null) {
    await pushNotification({
      recipientId: data.assignee_id,
      actorName: authorName,
      message: `${owner.subtaskNo}에 댓글을 남겼습니다: "${preview}"`,
      taskNo: data.parent_task_no,
      subtaskNo: owner.subtaskNo,
    })
  }
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
