import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type { RequestDraft } from '@/features/issues/api/types'
import { insertHistory } from '@/features/issues/api/writers'
import { PRIORITY_META } from '@/features/issues/constants/metadata'
import { AppError } from '@/shared/lib/app-error'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type UpdateRequestBody = {
  issueNo: string
  /** 등록 폼과 같은 항목 전부 — 첨부는 상세 화면의 첨부 버튼이 따로 맡는다 */
  draft: RequestDraft
  actorName: string
}

/** 승인 뒤에는 손댈 수 없는 값들 (스펙 §11.2) — 요청대기중·반려에서만 고친다 */
const EDITABLE_STATUSES = ['DRAFT', 'REJECTED'] as const

const yesNo = (value: boolean) => (value ? '예' : '아니오')

/** 바뀐 값이 있으면 true — 호출 측이 성공 토스트를 띄울지 판단한다 */
export const updateRequestService = async ({
  issueNo,
  draft,
  actorName,
}: UpdateRequestBody): Promise<boolean> => {
  const { data: current, error: readError } = await supabase
    .from('requests')
    .select(
      `status, title, description, priority, due_date,
       handles_personal_data, consumer_protection_target, dark_pattern_checked`
    )
    .eq('issue_no', issueNo)
    .single()
  if (readError) throw readError

  const changes: string[] = []
  if (draft.title !== current.title) changes.push(`제목 ${current.title} → ${draft.title}`)
  // 상세내용은 리치텍스트 HTML이라 앞뒤 값을 그대로 남기면 이력이 읽히지 않는다
  if (draft.description !== current.description) changes.push('상세내용 변경')
  if (draft.priority !== current.priority) {
    changes.push(
      `우선순위 ${PRIORITY_META[current.priority].label} → ${PRIORITY_META[draft.priority].label}`
    )
  }
  if (draft.dueDate !== current.due_date) {
    changes.push(`완료요청일 ${current.due_date} → ${draft.dueDate}`)
  }
  if (draft.handlesPersonalData !== current.handles_personal_data) {
    changes.push(
      `개인정보 취급 ${yesNo(current.handles_personal_data)} → ${yesNo(draft.handlesPersonalData)}`
    )
  }
  if (draft.consumerProtectionTarget !== current.consumer_protection_target) {
    changes.push(
      `소비자보호 대상 ${yesNo(current.consumer_protection_target)} → ${yesNo(draft.consumerProtectionTarget)}`
    )
  }
  if (draft.darkPatternChecked !== current.dark_pattern_checked) {
    changes.push(
      `다크패턴 확인 ${yesNo(current.dark_pattern_checked)} → ${yesNo(draft.darkPatternChecked)}`
    )
  }
  // 값을 그대로 두고 저장한 경우 — 이력만 쌓이므로 아무것도 하지 않는다
  if (changes.length === 0) return false

  const { data: updated, error } = await supabase
    .from('requests')
    .update({
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      due_date: draft.dueDate,
      handles_personal_data: draft.handlesPersonalData,
      consumer_protection_target: draft.consumerProtectionTarget,
      dark_pattern_checked: draft.darkPatternChecked,
    })
    .eq('issue_no', issueNo)
    // 화면에서도 막지만, 편집 도중 제출·승인된 낡은 화면의 저장은 여기서 끊는다
    .in('status', EDITABLE_STATUSES)
    .select('issue_no')
  if (error) throw error
  if (updated.length === 0) {
    throw new AppError('승인을 요청한 이슈는 수정할 수 없습니다. 화면을 새로고침해 주세요.')
  }

  const summary = changes.join(' · ')

  // 상태는 그대로 두고 수정 내용만 남긴다 (하위작업 생성 기록과 같은 방식)
  await insertHistory(
    { requestIssueNo: issueNo },
    {
      actorName,
      fromStatus: current.status,
      toStatus: current.status,
      reason: `이슈 내용 수정 · ${summary}`,
    }
  )

  await recordAuditLog({
    actorName,
    eventType: 'ISSUE_UPDATE',
    targetLabel: issueNo,
    targetIssueNo: issueNo,
    detail: summary,
  })

  return true
}

export const getUpdateRequestMutationKey = () => ['/requests', 'update'] as const

export function useUpdateRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getUpdateRequestMutationKey(),
    mutationFn: updateRequestService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
