/**
 * 백엔드 API 확정 전 임시 수기 타입.
 * OpenAPI 스키마가 나오면 `@/shared/types/api`의 생성 타입으로 교체한다.
 */

export type UserRole = 'REQUESTER' | 'WORKER' | 'LEAD' | 'ADMIN'

export type User = {
  /** Supabase 인증 계정 id (profiles.id) */
  id: string
  loginId: string
  name: string
  dept: string
  role: UserRole
  contact: string
  /** 서비스개발실 외부 소속 협업자 여부 (표시용) */
  external: boolean
  roleChangedAt: string | null
  roleChangedBy: string | null
}

/** 사내 조직도 노드. 중간 조직은 children을, 말단 조직은 구성원을 가진다. */
export type OrgNode = {
  id: string
  name: string
  children?: OrgNode[]
  /** 소속 구성원의 사번(User.loginId) */
  memberLoginIds?: string[]
}
