import type { EvidenceContent, StatusHistoryEntry, SubtaskStatus } from '@/features/tasks/api/types'
import { supabase } from '@/shared/lib/supabase'

/** 이력은 작업(부모)에도 하위작업(자식)에도 붙는다. 증적은 하위작업에만 남는다 */
export type ActivityOwner = { taskNo: string } | { subtaskNo: string }

const ownerColumns = (owner: ActivityOwner) => ({
  task_no: 'taskNo' in owner ? owner.taskNo : null,
  subtask_no: 'subtaskNo' in owner ? owner.subtaskNo : null,
})

/**
 * 단계 완료 증적을 링크·첨부와 함께 남긴다 (시나리오 각주 3).
 * 정정은 덮어쓰지 않고 새 건을 쌓아 앞선 기록을 이력으로 남긴다.
 */
export async function insertEvidence(
  owner: { subtaskNo: string },
  status: SubtaskStatus,
  evidence: EvidenceContent,
  recordedBy: string
) {
  const { data, error } = await supabase
    .from('evidences')
    .insert({
      subtask_no: owner.subtaskNo,
      subtask_status: status,
      memo: evidence.memo,
      recorded_by: recordedBy,
      // 시각은 DB default now()에 맡긴다 — 클라이언트 시계가 어긋나면
      // "마지막 건이 유효" 정렬이 사용자 PC 시계에 좌우된다
    })
    .select('id')
    .single()
  if (error) throw error

  if (evidence.links.length > 0) {
    const { error: linkError } = await supabase.from('reference_links').insert(
      evidence.links.map((link, position) => ({
        evidence_id: data.id,
        url: link.url,
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
    })
    .select()
  // 23505 = unique_violation
  if (error && error.code !== '23505') throw error
  return error === null
}
