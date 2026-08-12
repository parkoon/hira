import { queryOptions } from '@tanstack/react-query'

import { toUser } from '@/features/users/api/get-users'
import type { User } from '@/features/users/api/types'
import { supabase } from '@/shared/lib/supabase'

/** 로그인한 사용자의 프로필. 세션이 없으면 null이고, 화면은 로그인으로 돌려보낸다. */
export const getCurrentUserService = async (): Promise<User | null> => {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id
  if (userId === undefined) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data === null ? null : toUser(data)
}

export const getCurrentUserQueryKey = () => ['/users/me'] as const

export const getCurrentUserQueryOptions = () =>
  queryOptions({
    queryKey: getCurrentUserQueryKey(),
    queryFn: getCurrentUserService,
    // 세션은 브라우저가 들고 있어 매번 다시 물어볼 필요가 없다
    staleTime: Infinity,
  })
