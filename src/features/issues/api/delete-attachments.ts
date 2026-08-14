import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type { Attachment } from '@/features/issues/api/types'
import { formatFileSize } from '@/features/issues/constants/attachment-policy'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type DeleteAttachmentsBody = {
  issueNo: string
  /** 뗄 첨부 — 감사 로그에 이름을 남겨야 해서 id만이 아니라 항목을 통째로 받는다 */
  attachments: Attachment[]
  actorName: string
}

/**
 * 이슈에서 첨부를 뗀다. 파일 본문은 애초에 보관하지 않으므로(`attach-files.ts`) 행만 지운다.
 * 지운 뒤에는 되돌릴 수 없어 무엇을 뗐는지 감사 로그에 남긴다.
 */
export const deleteAttachmentsService = async ({
  issueNo,
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
    // 다른 이슈의 첨부를 지우는 요청은 id가 맞아도 통과시키지 않는다
    .eq('request_issue_no', issueNo)
  if (error) throw error

  await recordAuditLog({
    actorName,
    eventType: 'ATTACHMENT_DELETE',
    targetLabel: issueNo,
    targetIssueNo: issueNo,
    detail: attachments
      .map((attachment) => `${attachment.fileName} (${formatFileSize(attachment.size)})`)
      .join(', '),
  })
}

export const getDeleteAttachmentsMutationKey = () => ['/requests', 'delete-attachments'] as const

export function useDeleteAttachmentsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getDeleteAttachmentsMutationKey(),
    mutationFn: deleteAttachmentsService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
