import { createContext, useContext } from 'react'

import type { User, UserRole } from '@/features/users/api/types'
import { ROLE_LEVEL } from '@/features/users/constants/metadata'

/**
 * 로그인한 사용자. 인증 가드(`app/pages/app/layout.tsx`)가 세션을 확인한 뒤
 * 이 값을 내려주므로, 가드 안쪽에서는 항상 사용자가 있다.
 *
 * 쿼리를 화면마다 직접 읽지 않고 컨텍스트로 내리는 이유: 로그아웃하면 세션이
 * 사라지는 순간과 화면이 로그인으로 빠져나가는 순간 사이에 틈이 있는데,
 * 그 사이 각자 쿼리를 읽으면 사용자가 없는 상태를 보게 된다.
 */
export const CurrentUserContext = createContext<User | null>(null)

export function useCurrentUser() {
  const user = useContext(CurrentUserContext)

  if (user === null) throw new Error('인증 가드 안에서만 쓸 수 있습니다')

  /** 역할 계층(담당자 ⊂ 작업자 ⊂ 리드 ⊂ 관리자) 기준 권한 확인 — 스펙 §3.1 */
  const hasRole = (minRole: UserRole) => ROLE_LEVEL[user.role] >= ROLE_LEVEL[minRole]

  return { user, hasRole }
}
