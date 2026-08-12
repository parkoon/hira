import { useMutation, useQueryClient } from '@tanstack/react-query'

import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

export type SignOutBody = {
  actorName: string
}

export const signOutService = async ({ actorName }: SignOutBody) => {
  // 세션이 사라지면 RLS가 막으므로 로그아웃 전에 남긴다
  await recordAuditLog({ actorName, eventType: 'LOGOUT' })

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getSignOutMutationKey = () => ['/users/sign-out'] as const

export function useSignOutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getSignOutMutationKey(),
    mutationFn: signOutService,
    onSuccess: () => queryClient.clear(),
  })
}
