import type { UserRole } from '@/features/users/api/types'

/**
 * 데모 계정 규칙 — 사번으로 로그인하고, 인증 계정 이메일은 사번에서 만든다.
 * 실제 사내 SSO가 붙으면 이 파일은 사라진다 (스펙 §6-1).
 */
export const DEMO_PASSWORD = '123456'

export const toLoginEmail = (loginId: string) => `${loginId}@hira.demo`

export type QuickLoginAccount = {
  loginId: string
  name: string
  role: UserRole
}

/**
 * 로그인 화면의 바로 로그인 버튼 — 역할을 바꾸는 유일한 창구다.
 * 본인 사번으로 들어올 수도 있지만, 역할별 화면을 확인하려면 그 역할의 계정으로
 * 다시 로그인해야 하므로 네 역할을 한 명씩 여기에 둔다.
 */
export const QUICK_LOGIN_ACCOUNTS: QuickLoginAccount[] = [
  { loginId: '900001', name: '강민준', role: 'ADMIN' },
  { loginId: '900002', name: '윤서진', role: 'LEAD' },
  { loginId: '900003', name: '임도윤', role: 'WORKER' },
  { loginId: '900019', name: '김현주', role: 'REQUESTER' },
  { loginId: '900021', name: '최유진', role: 'REQUESTER' },
]
