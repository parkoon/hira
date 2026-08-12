import type {
  EvidenceContent,
  RequestStatus,
  StatusHistoryEntry,
  SubtaskStatus,
} from '@/features/issues/api/types'
import { supabase } from '@/shared/lib/supabase'

/** 증적·이력은 이슈(부모)에도 하위작업(자식)에도 붙는다 */
export type ActivityOwner = { requestIssueNo: string } | { subtaskIssueNo: string }

/** 화면은 담당자를 이름으로 다루고, 저장은 프로필 id로 한다 */
export async function resolveProfileIdByName(name: string) {
  const { data, error } = await supabase.from('profiles').select('id').eq('name', name).limit(1)
  if (error) throw error
  if (data.length === 0) throw new Error(`'${name}' 사용자를 찾을 수 없습니다`)
  return data[0].id
}

const ownerColumns = (owner: ActivityOwner) => ({
  request_issue_no: 'requestIssueNo' in owner ? owner.requestIssueNo : null,
  subtask_issue_no: 'subtaskIssueNo' in owner ? owner.subtaskIssueNo : null,
})

/**
 * 단계 완료 증적을 링크·첨부와 함께 남긴다 (시나리오 각주 3).
 * 정정은 덮어쓰지 않고 새 건을 쌓아 앞선 기록을 이력으로 남긴다.
 */
export async function insertEvidence(
  owner: ActivityOwner,
  status: RequestStatus | SubtaskStatus,
  evidence: EvidenceContent,
  recordedBy: string
) {
  const isRequest = 'requestIssueNo' in owner

  const { data, error } = await supabase
    .from('evidences')
    .insert({
      ...ownerColumns(owner),
      request_status: isRequest ? (status as RequestStatus) : null,
      subtask_status: isRequest ? null : (status as SubtaskStatus),
      memo: evidence.memo,
      recorded_by: recordedBy,
      recorded_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) throw error

  if (evidence.links.length > 0) {
    const { error: linkError } = await supabase.from('reference_links').insert(
      evidence.links.map((link, position) => ({
        evidence_id: data.id,
        url: link.url,
        label: link.label,
        position,
      }))
    )
    if (linkError) throw linkError
  }

  if (evidence.attachments.length > 0) {
    const { error: attachmentError } = await supabase.from('attachments').insert(
      evidence.attachments.map((file) => ({
        evidence_id: data.id,
        file_name: file.fileName,
        size: file.size,
      }))
    )
    if (attachmentError) throw attachmentError
  }
}

export type HistoryEntryInput = {
  actorName: string
  fromStatus: string | null
  toStatus: string
  via?: StatusHistoryEntry['via']
  reason?: string | null
}

export async function insertHistory(owner: ActivityOwner, entry: HistoryEntryInput) {
  const { error } = await supabase.from('status_history').insert({
    ...ownerColumns(owner),
    occurred_at: new Date().toISOString(),
    actor_name: entry.actorName,
    from_status: entry.fromStatus,
    to_status: entry.toStatus,
    via: entry.via ?? 'MANUAL',
    reason: entry.reason ?? null,
  })
  if (error) throw error
}

/** 이미 떨어진 결재는 다시 쌓지 않는다 (유니크 인덱스 위반은 무시) */
export async function insertApproval(
  owner: ActivityOwner,
  kind: 'COMPLIANCE' | 'CONSUMER_PROTECTION' | 'DBA',
  approvedBy: string
) {
  const { error } = await supabase
    .from('approvals')
    .insert({
      ...ownerColumns(owner),
      kind,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .select()
  // 23505 = unique_violation
  if (error && error.code !== '23505') throw error
  return error === null
}
