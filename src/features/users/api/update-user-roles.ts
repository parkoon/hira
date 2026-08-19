import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { getUsersQueryKeyPrefix } from '@/features/users/api/get-users'
import type { UserRole } from '@/features/users/api/types'
import { USER_ROLE_META } from '@/features/users/constants/metadata'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type UserRoleAssignment = {
  userId: string
  role: UserRole
}

export type UpdateUserRolesBody = {
  /** 사용자마다 다른 역할을 줄 수 있다 — 구성원 추가는 한 번에 섞어서 지정한다 */
  assignments: UserRoleAssignment[]
  /** 역할을 바꾼 관리자 이름 — 변경 이력으로 남는다 (스펙 §3.2) */
  changedBy: string
}

export const updateUserRolesService = async ({ assignments, changedBy }: UpdateUserRolesBody) => {
  const userIds = assignments.map((assignment) => assignment.userId)

  // 감사 로그에 "이전 → 이후"를 남기려면 바꾸기 전 역할을 먼저 읽어야 한다 (스펙 §11.4)
  const { data: before, error: readError } = await supabase
    .from('profiles')
    .select('id, name, role')
    .in('id', userIds)
  if (readError) throw readError

  const changedAt = format(new Date(), 'yyyy-MM-dd')

  // 같은 역할끼리 묶어 한 번씩만 갱신한다 — 부여 가능한 역할이 둘뿐이라 왕복도 둘을 넘지 않는다
  const idsByRole = new Map<UserRole, string[]>()
  for (const { userId, role } of assignments) {
    idsByRole.set(role, [...(idsByRole.get(role) ?? []), userId])
  }

  for (const [role, ids] of idsByRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role, role_changed_at: changedAt, role_changed_by: changedBy })
      .in('id', ids)
    if (error) throw error
  }

  const roleByUserId = new Map(assignments.map(({ userId, role }) => [userId, role]))

  await recordAuditLog(
    before.flatMap((target) => {
      const nextRole = roleByUserId.get(target.id)
      // 이미 그 역할이면 바뀐 게 없어 기록하지 않는다
      if (!nextRole || nextRole === target.role) return []

      return [
        {
          actorName: changedBy,
          eventType: 'ROLE_CHANGE' as const,
          targetLabel: target.name,
          detail: `${USER_ROLE_META[target.role].label} → ${USER_ROLE_META[nextRole].label}`,
        },
      ]
    })
  )
}

export const getUpdateUserRolesMutationKey = () => ['/users', 'update-roles'] as const

export function useUpdateUserRolesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getUpdateUserRolesMutationKey(),
    mutationFn: updateUserRolesService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getUsersQueryKeyPrefix() }),
  })
}
