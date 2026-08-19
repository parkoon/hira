import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { Attachment } from '@/features/tasks/api/types'
import { formatFileSize } from '@/features/tasks/constants/attachment-policy'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type DeleteAttachmentsBody = {
  taskNo: string
  /** 뗄 첨부 — 감사 로그에 이름을 남겨야 해서 id만이 아니라 항목을 통째로 받는다 */
  attachments: Attachment[]
  actorName: string
}

/**
 * 작업에서 첨부를 뗀다. 행을 먼저 지우고 storage 본문은 뒤따라 지운다 —
 * 행이 없으면 화면·감사에서 사라진 것이고, 본문 삭제가 실패해도 되돌릴 행이 없어
 * 실패로 알리지 않고 고아 정리 대상으로만 남긴다.
 * 지운 뒤에는 되돌릴 수 없어 무엇을 뗐는지 감사 로그에 남긴다.
 */
export const deleteAttachmentsService = async ({
  taskNo,
  attachments,
  actorName,
}: DeleteAttachmentsBody) => {
  if (attachments.length === 0) return

  const { error } = await supabase
    .from('attachments')
    .delete()
    .in(
      'id',
      attachments.map((attachment) => attachment.id)
    )
    // 다른 작업의 첨부를 지우는 요청은 id가 맞아도 통과시키지 않는다
    .eq('task_no', taskNo)
  if (error) throw error

  const storagePaths = attachments
    .map((attachment) => attachment.storagePath)
    .filter((path): path is string => path !== null)
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage.from('attachments').remove(storagePaths)
    if (storageError) console.error('첨부 본문을 지우지 못했습니다', storageError)
  }

  await recordAuditLog({
    actorName,
    eventType: 'ATTACHMENT_DELETE',
    targetLabel: taskNo,
    targetTaskNo: taskNo,
    detail: attachments
      .map((attachment) => `${attachment.fileName} (${formatFileSize(attachment.size)})`)
      .join(', '),
  })
}

export const getDeleteAttachmentsMutationKey = () => ['/tasks', 'delete-attachments'] as const

export function useDeleteAttachmentsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getDeleteAttachmentsMutationKey(),
    mutationFn: deleteAttachmentsService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
