import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { type ActivityOwner, ownerColumns } from '@/features/tasks/api/writers'
import { extractMentionIds, htmlToText } from '@/features/tasks/utils/comment-content'
import { pushNotification } from '@/shared/lib/notifications'
import { supabase } from '@/shared/lib/supabase'

export type CreateCommentBody = {
  owner: ActivityOwner
  /** Tiptap이 만든 HTML — 멘션은 data-id에 profiles.id를 갖는다 */
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

  // 알림 대상 — 레코드 주인(등록자/작업자)과 지금까지 댓글을 단 사람들(대화 참여자).
  // 참여자가 빠지면 주인이 단 답글을 상대가 영영 모른다. 언급된 사람은 문구를 바꿔
  // 덮어쓰고, 본인 몫은 헬퍼가 거른다
  const text = htmlToText(body).replace(/\s+/g, ' ').trim()
  const preview = text.length > 40 ? `${text.slice(0, 40)}…` : text
  const key = 'taskNo' in owner ? owner.taskNo : owner.subtaskNo

  let taskNo: string
  let subtaskNo: string | null = null
  let recipients: string[]

  if ('taskNo' in owner) {
    const { data } = await supabase
      .from('tasks')
      .select('requester_id, comments(author_id)')
      .eq('task_no', owner.taskNo)
      .maybeSingle()
    if (!data) return
    taskNo = owner.taskNo
    recipients = [data.requester_id, ...data.comments.map((comment) => comment.author_id)]
  } else {
    const { data } = await supabase
      .from('subtasks')
      .select('assignee_id, parent_task_no, comments(author_id)')
      .eq('subtask_no', owner.subtaskNo)
      .maybeSingle()
    if (!data) return
    taskNo = data.parent_task_no
    subtaskNo = owner.subtaskNo
    recipients = [
      ...(data.assignee_id === null ? [] : [data.assignee_id]),
      ...data.comments.map((comment) => comment.author_id),
    ]
  }

  const messageByRecipient = new Map<string, string>()
  for (const recipientId of recipients) {
    messageByRecipient.set(recipientId, `${key}에 댓글을 남겼습니다: "${preview}"`)
  }
  for (const recipientId of extractMentionIds(body)) {
    messageByRecipient.set(recipientId, `${key}에서 회원님을 언급했습니다: "${preview}"`)
  }

  await pushNotification(
    [...messageByRecipient].map(([recipientId, message]) => ({
      recipientId,
      actorName: authorName,
      message,
      taskNo,
      subtaskNo,
    }))
  )
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
