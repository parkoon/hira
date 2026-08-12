import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type { RequestDraft } from '@/features/issues/api/types'
import { insertHistory } from '@/features/issues/api/writers'
import { formatFileSize } from '@/features/issues/constants/attachment-policy'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type CreateRequestBody = {
  draft: RequestDraft
  /** 등록 화면에서 고른 첨부. File은 브라우저 객체라 draft에 넣지 않고 따로 받는다 */
  files: File[]
  requesterId: string
  requesterName: string
}

/** 채번은 등록 연도 기준, 남아 있는 번호 중 최대값 다음이다 */
async function nextRequestNo() {
  const prefix = `WR-${new Date().getFullYear()}-`

  const { data, error } = await supabase
    .from('requests')
    .select('issue_no')
    .like('issue_no', `${prefix}%`)
    .order('issue_no', { ascending: false })
    .limit(1)
  if (error) throw error

  const lastSequence = data.length === 0 ? 0 : Number(data[0].issue_no.slice(prefix.length))
  const next = Number.isNaN(lastSequence) ? 1 : lastSequence + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

/** 등록은 임시저장까지 — 제출은 상세에서 별도로 한다 (시나리오 1·2) */
export const createRequestService = async ({
  draft,
  files,
  requesterId,
  requesterName,
}: CreateRequestBody): Promise<string> => {
  const issueNo = await nextRequestNo()

  const { error } = await supabase.from('requests').insert({
    issue_no: issueNo,
    title: draft.title,
    description: draft.description,
    status: 'DRAFT',
    priority: draft.priority,
    requester_id: requesterId,
    due_date: draft.dueDate,
    created_at: format(new Date(), 'yyyy-MM-dd'),
    handles_personal_data: draft.handlesPersonalData,
    consumer_protection_target: draft.consumerProtectionTarget,
    dark_pattern_checked: draft.darkPatternChecked,
  })
  if (error) throw error

  if (files.length > 0) {
    const { error: attachmentError } = await supabase.from('attachments').insert(
      files.map((file) => ({
        request_issue_no: issueNo,
        file_name: file.name,
        size: file.size,
      }))
    )
    if (attachmentError) throw attachmentError
  }

  await insertHistory(
    { requestIssueNo: issueNo },
    { actorName: requesterName, fromStatus: null, toStatus: 'DRAFT' }
  )

  if (files.length > 0) {
    await recordAuditLog({
      actorName: requesterName,
      eventType: 'ATTACHMENT_UPLOAD',
      targetLabel: issueNo,
      targetIssueNo: issueNo,
      detail: files.map((file) => `${file.name} (${formatFileSize(file.size)})`).join(', '),
    })
  }

  return issueNo
}

export const getCreateRequestMutationKey = () => ['/requests', 'create'] as const

export function useCreateRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getCreateRequestMutationKey(),
    mutationFn: createRequestService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
