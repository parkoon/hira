import { queryOptions } from '@tanstack/react-query'

import type { User } from '@/features/users/api/types'
import { supabase } from '@/shared/lib/supabase'
import type { Database } from '@/shared/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export const toUser = (row: ProfileRow): User => ({
  id: row.id,
  loginId: row.login_id,
  name: row.name,
  dept: row.dept,
  role: row.role,
  contact: row.contact,
  external: row.external,
  roleChangedAt: row.role_changed_at,
  roleChangedBy: row.role_changed_by,
})

export const getUsersService = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*').order('login_id')
  if (error) throw error
  return data.map(toUser)
}

export const getUsersQueryKeyPrefix = () => ['/users'] as const

export const getUsersQueryKey = () => [...getUsersQueryKeyPrefix()] as const

export const getUsersQueryOptions = () =>
  queryOptions({
    queryKey: getUsersQueryKey(),
    queryFn: getUsersService,
  })
