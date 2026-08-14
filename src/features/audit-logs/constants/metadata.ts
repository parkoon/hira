import type { AuditEventType } from '@/features/audit-logs/api/types'
import type { EnumMetadata } from '@/shared/utils/enum'

export const AUDIT_EVENT_META = {
  LOGIN_SUCCESS: { label: '로그인 성공', order: 10, tone: 'neutral' },
  LOGIN_FAILURE: { label: '로그인 실패', order: 20, tone: 'danger' },
  LOGOUT: { label: '로그아웃', order: 30, tone: 'neutral' },
  // 화면 어휘는 '승인 요청'이다. enum 이름(ISSUE_SUBMIT)과 DB 컬럼(submitted_at)은 그대로다
  ISSUE_SUBMIT: { label: '승인 요청', order: 40, tone: 'info' },
  ISSUE_UPDATE: { label: '이슈 수정', order: 45, tone: 'warning' },
  ISSUE_APPROVE: { label: '이슈 승인', order: 50, tone: 'success' },
  ISSUE_REJECT: { label: '이슈 반려', order: 60, tone: 'danger' },
  ISSUE_COMPLETE: { label: '최종 완료', order: 70, tone: 'success' },
  SUBTASK_CREATE: { label: '하위작업 생성', order: 80, tone: 'info' },
  SUBTASK_UPDATE: { label: '하위작업 수정', order: 85, tone: 'warning' },
  SUBTASK_TRANSITION: { label: '상태 전이', order: 90, tone: 'info' },
  ROLE_CHANGE: { label: '역할 변경', order: 100, tone: 'danger' },
  ATTACHMENT_UPLOAD: { label: '첨부 업로드', order: 110, tone: 'warning' },
  ATTACHMENT_DELETE: { label: '첨부 삭제', order: 115, tone: 'danger' },
  ATTACHMENT_DOWNLOAD: { label: '첨부 다운로드', order: 120, tone: 'warning' },
} satisfies Record<AuditEventType, EnumMetadata>

export const AUDIT_PERIOD_META = {
  '7D': { label: '최근 7일', order: 10 },
  '1M': { label: '최근 1개월', order: 20 },
  '3M': { label: '최근 3개월', order: 30 },
  ALL: { label: '전체', order: 40 },
} satisfies Record<string, EnumMetadata>
