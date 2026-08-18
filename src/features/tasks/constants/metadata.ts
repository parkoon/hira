import type {
  ApprovalKind,
  Priority,
  SubtaskStatus,
  SubtaskType,
  TaskStatus,
} from '@/features/tasks/api/types'
import type { EnumMetadata } from '@/shared/utils/enum'

/** 작업(부모) 상태 — 부모는 하위작업의 집계라 작업중에서 바로 완료로 간다 */
export const TASK_STATUS_META = {
  DRAFT: { label: '요청 대기중', order: 10, tone: 'neutral', description: '임시저장' },
  PENDING_APPROVAL: { label: '요청 승인 대기중', order: 20, tone: 'warning' },
  IN_PROGRESS: { label: '작업중', order: 30, tone: 'info' },
  DONE: { label: '완료', order: 40, tone: 'success' },
  REJECTED: { label: '반려', order: 50, tone: 'danger' },
} satisfies Record<TaskStatus, EnumMetadata>

/** 하위작업 유형 — 워크플로를 결정한다 (스펙 §5.2) */
export const SUBTASK_TYPE_META = {
  DEPLOY: { label: '배포형', order: 10, tone: 'info' },
  NON_DEPLOY: { label: '비배포형', order: 20, tone: 'neutral' },
} satisfies Record<SubtaskType, EnumMetadata>

/**
 * 하위작업(자식) 상태 — 시나리오 6~18. 배포형·비배포형 상태를 모두 담는다.
 * order는 필터 옵션 등 나열 순서이며, 스테퍼 단계 번호는
 * 하위작업별 플로우(`getSubtaskFlow`)의 인덱스를 사용한다.
 */
export const SUBTASK_STATUS_META = {
  TODO: { label: '작업 대기중', order: 1, tone: 'neutral' },
  ANALYSIS: { label: '분석 설계중', order: 2, tone: 'info' },
  DEVELOPMENT: { label: '개발중', order: 3, tone: 'info' },
  DBA_VERIFICATION: { label: 'DBA 검증중', order: 4, tone: 'warning' },
  THIRD_PARTY: { label: '제3자 검증중', order: 5, tone: 'warning' },
  FUNCTIONAL_TEST: { label: '기능 테스트중', order: 6, tone: 'info' },
  ACCEPTANCE: { label: '인수 테스트중', order: 7, tone: 'warning' },
  DEPLOY_WAITING: { label: '이행 대기중', order: 8, tone: 'neutral' },
  POST_DEPLOY_CHECK: { label: '이행 후 점검중', order: 9, tone: 'warning' },
  IN_PROGRESS: { label: '작업중', order: 10, tone: 'info' },
  REVIEW: { label: '검토중', order: 11, tone: 'warning' },
  DONE: { label: '완료', order: 12, tone: 'success' },
} satisfies Record<SubtaskStatus, EnumMetadata>

/**
 * 전진 전이 버튼 라벨.
 * 다음 상태 이름을 부르는 대신 "지금 단계를 끝낸다"는 관점으로 적는다.
 * 작업자는 다음 단계가 뭔지보다 방금 무엇을 마쳤는지로 판단한다.
 *
 * 라벨이 없는 단계에는 전진 버튼이 없다 — DBA검증중은 결재가 떨어지면 자동으로
 * 넘어가고(시나리오 9), 완료는 더 갈 곳이 없다.
 */
export const SUBTASK_ADVANCE_LABEL: Partial<Record<SubtaskStatus, string>> = {
  TODO: '작업 시작',
  ANALYSIS: '분석 완료',
  DEVELOPMENT: '개발 완료',
  THIRD_PARTY: '검증 완료',
  FUNCTIONAL_TEST: '테스트 완료',
  // 이 단계만 전이 주체가 부모 작업의 등록자다 — canActOnSubtaskStep 참조
  ACCEPTANCE: '인수 확인',
  DEPLOY_WAITING: '이행 완료',
  POST_DEPLOY_CHECK: '점검 완료',
  IN_PROGRESS: '작업 완료',
  REVIEW: '검토 완료',
}

/** 결재 종류 — 결재선 연동 전 임시 표시용 (시나리오 3·9) */
export const APPROVAL_KIND_META = {
  COMPLIANCE: { label: '컴플라이언스', order: 10, tone: 'warning' },
  CONSUMER_PROTECTION: { label: '소비자보호', order: 20, tone: 'warning' },
  DBA: { label: 'DBA', order: 30, tone: 'warning' },
} satisfies Record<ApprovalKind, EnumMetadata>

/** MVP에서는 표시·정렬용 (스펙 §4.1) */
export const PRIORITY_META = {
  URGENT: { label: '긴급', order: 10, tone: 'danger' },
  HIGH: { label: '높음', order: 20, tone: 'warning' },
  NORMAL: { label: '보통', order: 30, tone: 'neutral' },
  LOW: { label: '낮음', order: 40, tone: 'neutral' },
} satisfies Record<Priority, EnumMetadata>

/** 값 목록이 필요한 곳(zod enum 등)의 단일 소스 — META 키에서 파생해 사본 드리프트를 막는다 */
export const PRIORITIES = Object.keys(PRIORITY_META) as [Priority, ...Priority[]]
