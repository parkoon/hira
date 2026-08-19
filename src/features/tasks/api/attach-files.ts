import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { formatFileSize, getFileExtension } from '@/features/tasks/constants/attachment-policy'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type AttachFilesBody = {
  taskNo: string
  files: File[]
  actorName: string
}

/**
 * 파일 본문을 storage에 올리고 첨부 목록에 행을 추가한다.
 * 화면에 보여줄 이름은 행(file_name)이 갖는다 — storage 키는 한글 이름이 거부될 수 있어
 * uuid로 만들고, 사람이 대시보드에서 알아볼 정도의 확장자만 남긴다.
 */
export const attachFilesService = async ({ taskNo, files, actorName }: AttachFilesBody) => {
  if (files.length === 0) return

  const rows: { task_no: string; file_name: string; size: number; storage_path: string }[] = []
  for (const file of files) {
    const extension = getFileExtension(file.name)
    const path = `${taskNo}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`

    // 도중에 실패하면 앞서 올라간 본문은 고아로 남는다 — 행이 없어 화면에는 안 보이고,
    // 재시도가 새 키로 다시 올리므로 동작은 막히지 않는다
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(path, file, { contentType: file.type || undefined })
    if (uploadError) throw uploadError

    rows.push({ task_no: taskNo, file_name: file.name, size: file.size, storage_path: path })
  }

  const { error } = await supabase.from('attachments').insert(rows)
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
