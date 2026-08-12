import { supabase } from '@/shared/lib/supabase'
import type { Database } from '@/shared/types/database'

/**
 * 스펙 §11.4 기록 이벤트. 여러 도메인이 남기므로 `features/` 밑이 아니라 여기 둔다
 * (도메인끼리 서로를 import하지 않게 하려는 것). 조회는 `features/audit-logs/`가 맡는다.
 */
export type AuditEventType = Database['public']['Enums']['audit_event_type']

export type AuditLogEntry = {
  actorName: string
  eventType: AuditEventType
  /** 목록의 '대상' 열. 이슈번호이거나 사용자 이름이다 */
  targetLabel?: string | null
  /** 채워두면 대상에서 이슈 상세로 이동할 수 있다 */
  targetIssueNo?: string | null
  detail?: string | null
}

/**
 * 업무 동작이 끝난 뒤 곁다리로 붙는 기록이라, 여기서 실패해도 동작을 되돌리지 않는다.
 * 승인이 이미 커밋됐는데 로그를 못 남겼다고 "승인 실패" 토스트를 띄우면 사실과 다르다.
 * 대신 콘솔로 남겨 모니터링(console 계측 on)이 주워가게 한다.
 *
 * IP는 브라우저가 알 수 없어 비운다 — 컬럼 기본값이 빈 문자열이고, 서버 API가 붙으면 그쪽이 채운다.
 * 로그인 실패는 세션이 없어 RLS(`to authenticated`)가 막으므로 여기서 남길 수 없다.
 * 그 이벤트는 인증 훅이 서버에서 남겨야 한다.
 */
export async function recordAuditLog(entries: AuditLogEntry | AuditLogEntry[]): Promise<void> {
  // 한 동작이 여러 건을 남길 때(역할 일괄 부여) 왕복을 한 번으로 묶는다
  const list = Array.isArray(entries) ? entries : [entries]
  if (list.length === 0) return

  const { error } = await supabase.from('audit_logs').insert(
    list.map((entry) => ({
      actor_name: entry.actorName,
      event_type: entry.eventType,
      target_label: entry.targetLabel ?? null,
      target_issue_no: entry.targetIssueNo ?? null,
      detail: entry.detail ?? null,
    }))
  )

  if (error) console.error('감사 로그를 남기지 못했습니다', error)
}
