import { useSuspenseQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { getUsersQueryOptions } from '@/features/users/api/get-users'
import type { User, UserRole } from '@/features/users/api/types'
import { useUpdateUserRolesMutation } from '@/features/users/api/update-user-roles'
import { USER_ROLE_META } from '@/features/users/constants/metadata'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { Page } from '@/shared/components/ui/layout/page'

import { AssignRoleDialog } from './_components/assign-role-dialog'
import { UserFilters } from './_components/user-filters'
import { UsersTable } from './_components/users-table'
import { applyUserFilters, userFilterParsers } from './_utils/user-filters'

/** 화면 10 — 사용자 관리 (관리자, 스펙 §6-8) */
function UserManagementPage() {
  const { user: currentUser } = useCurrentUser()
  const [filters] = useQueryStates(userFilterParsers)
  const usersQuery = useSuspenseQuery(getUsersQueryOptions())
  const updateUserRoles = useUpdateUserRolesMutation()
  const [assignOpen, setAssignOpen] = useState(false)

  const users = usersQuery.data

  /** 역할 변경 이력을 남기며 지정한 사용자들의 역할을 갈아끼운다 (스펙 §3.2) */
  const setRoleOf = useCallback(
    (userIds: string[], nextRole: UserRole, onSuccess: () => void) => {
      updateUserRoles.mutate(
        { userIds, role: nextRole, changedBy: currentUser.name },
        { onSuccess }
      )
    },
    [updateUserRoles, currentUser.name]
  )

  const handleAssign = useCallback(
    (userIds: string[], role: UserRole) => {
      setRoleOf(userIds, role, () =>
        toast.success(`${userIds.length}명에게 ${USER_ROLE_META[role].label} 역할을 부여했습니다.`)
      )
    },
    [setRoleOf]
  )

  const handleRoleChange = useCallback(
    (target: User, nextRole: UserRole) => {
      setRoleOf([target.id], nextRole, () =>
        toast.success(
          `${target.name}의 역할을 ${USER_ROLE_META[target.role].label} → ${USER_ROLE_META[nextRole].label}(으)로 변경했습니다.`
        )
      )
    },
    [setRoleOf]
  )

  const handleRevoke = useCallback(
    (target: User) => {
      setRoleOf([target.id], 'REQUESTER', () =>
        toast.success(`${target.name}의 ${USER_ROLE_META[target.role].label} 역할을 회수했습니다.`)
      )
    },
    [setRoleOf]
  )

  // 담당자는 최초 로그인 시 자동 부여되는 기본 역할이라 명부에 올리지 않는다 (스펙 §3.2)
  const filteredUsers = useMemo(
    () =>
      applyUserFilters(
        users.filter((user) => user.role !== 'REQUESTER'),
        filters
      ),
    [users, filters]
  )

  return (
    <Page
      className="overflow-y-hidden"
      noContentPadding
    >
      {/* 필터가 늘면 왼쪽만 가로로 흐르고 구성원 추가 버튼은 오른쪽에 붙어 있는다 */}
      <div className="mb-3 flex items-center justify-between gap-2 px-2 pt-3">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <UserFilters />
        </div>
        <Button onClick={() => setAssignOpen(true)}>구성원 추가</Button>
      </div>

      <UsersTable
        users={filteredUsers}
        onRoleChange={handleRoleChange}
        onRevoke={handleRevoke}
      />

      <AssignRoleDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        users={users}
        onAssign={handleAssign}
      />
    </Page>
  )
}

export { UserManagementPage as Component }
