/**
 * 백엔드 API 확정 전 임시 수기 타입.
 * OpenAPI 스키마가 나오면 `@/shared/types/api`의 생성 타입으로 교체한다.
 */

/** 감사 이벤트 — 스펙 §11.4 기록 이벤트 목록 */
export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'ISSUE_SUBMIT'
  | 'ISSUE_APPROVE'
  | 'ISSUE_REJECT'
  | 'ISSUE_COMPLETE'
  | 'SUBTASK_CREATE'
  | 'SUBTASK_TRANSITION'
  | 'ROLE_CHANGE'
  | 'ATTACHMENT_UPLOAD'
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
