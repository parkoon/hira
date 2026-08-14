/**
 * 앱 레이어가 쓰는 도메인 DTO 타입.
 * DB enum·row와의 정합성은 `@/shared/types/database`(Supabase 생성 타입)가 기준이다.
 */

/** 감사 이벤트 — 스펙 §11.4 기록 이벤트 목록 */
export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'ISSUE_SUBMIT'
  | 'ISSUE_UPDATE'
  | 'ISSUE_APPROVE'
  | 'ISSUE_REJECT'
  | 'ISSUE_COMPLETE'
  | 'SUBTASK_CREATE'
  | 'SUBTASK_UPDATE'
  | 'SUBTASK_TRANSITION'
  | 'ROLE_CHANGE'
  | 'ATTACHMENT_UPLOAD'
  | 'ATTACHMENT_DELETE'
  | 'ATTACHMENT_DOWNLOAD'

export type AuditLog = {
  id: number
  occurredAt: string
  /** API 토큰에 의한 이벤트는 행위자가 없어 'unknown'으로 기록된다 */
  actorName: string
  eventType: AuditEventType
  targetLabel: string | null
  /** 이슈 번호 대상이면 상세 화면으로 이동 가능 */
  targetIssueNo: string | null
  detail: string | null
  ipAddress: string
}
