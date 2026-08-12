import type { UserRole } from '@/features/users/api/types'
import type { EnumMetadata } from '@/shared/utils/enum'

export const USER_ROLE_META = {
  REQUESTER: {
    label: '요청자',
    order: 10,
    description: '이슈 등록 · 본인 이슈 조회',
    tone: 'neutral',
  },
  WORKER: {
    label: '작업자',
    order: 20,
    description: '전체 이슈 조회 · 담당 하위작업 전이',
    tone: 'neutral',
  },
  LEAD: {
    label: '리드',
    order: 30,
    description: '이슈 승인/반려 · 하위작업 배정 · 최종 완료',
    tone: 'info',
  },
  ADMIN: {
    label: '관리자',
    order: 40,
    description: '사용자 역할 관리 · 감사 로그',
    tone: 'warning',
  },
} satisfies Record<UserRole, EnumMetadata>

/**
 * 사용자 관리 화면의 명부에 오르는 역할.
 * 요청자는 사내 계정 최초 로그인 시 자동 부여되므로 관리 대상이 아니다 (스펙 §3.2).
 */
export const MANAGED_ROLES = ['WORKER', 'LEAD', 'ADMIN'] as const satisfies readonly UserRole[]

/** 관리자가 화면에서 부여할 수 있는 역할. 관리자 역할은 시스템 셋업에서만 지정한다 (스펙 §3.2). */
export const ASSIGNABLE_ROLES = ['WORKER', 'LEAD'] as const satisfies readonly UserRole[]

/** 역할은 계층 구조: 요청자 ⊂ 작업자 ⊂ 리드 ⊂ 관리자 (스펙 §3.1) */
export const ROLE_LEVEL: Record<UserRole, number> = {
  REQUESTER: 0,
  WORKER: 1,
  LEAD: 2,
  ADMIN: 3,
}
