import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { formatFileSize } from '@/features/tasks/constants/attachment-policy'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type AttachFilesBody = {
  taskNo: string
  files: File[]
  actorName: string
}

/**
 * 첨부 목록에 파일을 추가한다.
 * 데모 범위에서는 파일 본문을 보관하지 않고 이름과 크기만 남긴다.
 */
export const attachFilesService = async ({ taskNo, files, actorName }: AttachFilesBody) => {
  if (files.length === 0) return

  const { error } = await supabase.from('attachments').insert(
    files.map((file) => ({
      task_no: taskNo,
      file_name: file.name,
      size: file.size,
    }))
  )
  if (error) throw error

  await recordAuditLog({
    actorName,
    eventType: 'ATTACHMENT_UPLOAD',
    targetLabel: taskNo,
    targetTaskNo: taskNo,
    detail: files.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(', '),
  })
}

export const getAttachFilesMutationKey = () => ['/tasks', 'attach-files'] as const

export function useAttachFilesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getAttachFilesMutationKey(),
    mutationFn: attachFilesService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
