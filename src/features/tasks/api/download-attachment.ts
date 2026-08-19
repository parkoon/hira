import { useMutation } from '@tanstack/react-query'

import type { Attachment } from '@/features/tasks/api/types'
import { formatFileSize } from '@/features/tasks/constants/attachment-policy'
import { AppError } from '@/shared/lib/app-error'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type DownloadAttachmentBody = {
  taskNo: string
  attachment: Attachment
  actorName: string
}

/**
 * 첨부 내려받기 URL을 만들고 감사 로그를 남긴다 (스펙 §11.4 ATTACHMENT_DOWNLOAD).
 * 버킷이 비공개라 서명 URL을 쓰고, 내려받는 파일 이름은 storage 키(uuid)가 아니라
 * 행이 가진 원래 이름으로 되돌린다.
 */
export const downloadAttachmentService = async ({
  taskNo,
  attachment,
  actorName,
}: DownloadAttachmentBody): Promise<string> => {
  // 화면이 미리 막지만, 본문 없는 데모 첨부가 흘러들어오면 여기서 끊는다
  if (attachment.storagePath === null) {
    throw new AppError('본문이 보관되지 않은 데모 첨부라 내려받을 수 없습니다.')
  }

  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(attachment.storagePath, 60, { download: attachment.fileName })
  if (error) throw error

  await recordAuditLog({
    actorName,
    eventType: 'ATTACHMENT_DOWNLOAD',
    targetLabel: taskNo,
    targetTaskNo: taskNo,
    detail: `${attachment.fileName} (${formatFileSize(attachment.size)})`,
  })

  return data.signedUrl
}

export const getDownloadAttachmentMutationKey = () => ['/tasks', 'download-attachment'] as const

export function useDownloadAttachmentMutation() {
  return useMutation({
    mutationKey: getDownloadAttachmentMutationKey(),
    mutationFn: downloadAttachmentService,
  })
}
