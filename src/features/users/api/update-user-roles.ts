import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { getUsersQueryKeyPrefix } from '@/features/users/api/get-users'
import type { UserRole } from '@/features/users/api/types'
import { USER_ROLE_META } from '@/features/users/constants/metadata'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type UpdateUserRolesBody = {
  userIds: string[]
  role: UserRole
  /** 역할을 바꾼 관리자 이름 — 변경 이력으로 남는다 (스펙 §3.2) */
  changedBy: string
}

export const updateUserRolesService = async ({ userIds, role, changedBy }: UpdateUserRolesBody) => {
  // 감사 로그에 "이전 → 이후"를 남기려면 바꾸기 전 역할을 먼저 읽어야 한다 (스펙 §11.4)
  const { data: before, error: readError } = await supabase
    .from('profiles')
    .select('id, name, role')
    .in('id', userIds)
  if (readError) throw readError

  const { error } = await supabase
    .from('profiles')
    .update({
      role,
      role_changed_at: format(new Date(), 'yyyy-MM-dd'),
      role_changed_by: changedBy,
    })
    .in('id', userIds)
  if (error) throw error

  await recordAuditLog(
    before
      // 이미 그 역할이면 바뀐 게 없어 기록하지 않는다
      .filter((target) => target.role !== role)
      .map((target) => ({
        actorName: changedBy,
        eventType: 'ROLE_CHANGE' as const,
        targetLabel: target.name,
        detail: `${USER_ROLE_META[target.role].label} → ${USER_ROLE_META[role].label}`,
      }))
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
