import { Navigate, Outlet } from 'react-router'

import type { UserRole } from '@/features/users/api/types'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { paths } from '@/shared/config/paths'

/**
 * 역할이 모자라면 이슈 목록으로 돌려보낸다 (스펙 §3.1).
 *
 * 사이드바의 `minRole`은 메뉴를 감출 뿐이라 주소를 직접 치면 화면이 열린다.
 * 역할 전환기로 권한이 낮아졌을 때도 보던 화면에 그대로 남는 문제를 함께 막는다.
 */
export function RequireRole({ minRole }: { minRole: UserRole }) {
  const { hasRole } = useCurrentUser()

  if (!hasRole(minRole)) {
    return (
      <Navigate
        to={paths.app.issues.root.getHref()}
        replace
      />
    )
  }

  return <Outlet />
}
