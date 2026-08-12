import { useMutation, useQueryClient } from '@tanstack/react-query'

import { toLoginEmail } from '@/features/users/constants/demo-accounts'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type SignInBody = {
  /** 사번 */
  loginId: string
  password: string
}

export const signInService = async ({ loginId, password }: SignInBody) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toLoginEmail(loginId),
    password,
  })
  if (error) throw error

  // 세션이 생긴 뒤에야 감사 로그를 남길 수 있다 (RLS가 authenticated에만 열려 있다).
  // 로그인 실패는 세션이 없어 여기서 남길 수 없다 — 인증 훅이 서버에서 남겨야 한다.
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', data.user.id)
    .maybeSingle()

  await recordAuditLog({ actorName: profile?.name ?? loginId, eventType: 'LOGIN_SUCCESS' })
}

export const getSignInMutationKey = () => ['/users/sign-in'] as const

export function useSignInMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getSignInMutationKey(),
    mutationFn: signInService,
    // 로그인한 사람이 바뀌면 화면에 남은 데이터도 전부 다시 받는다
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
