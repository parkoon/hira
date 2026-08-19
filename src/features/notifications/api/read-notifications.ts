import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getNotificationsQueryKeyPrefix } from '@/features/notifications/api/get-notifications'
import { supabase } from '@/shared/lib/supabase'

export type ReadNotificationsBody = {
  recipientId: string
  /** 지정하면 그 알림만, 없으면 안 읽은 전부 (모두 읽음) */
  ids?: number[]
}

export const readNotificationsService = async ({ recipientId, ids }: ReadNotificationsBody) => {
  let query = supabase
    .from('notifications')
    // 읽음 시각은 정렬에 쓰이지 않아 클라이언트 시계로 충분하다
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', recipientId)
    .is('read_at', null)
  if (ids !== undefined) query = query.in('id', ids)

  const { error } = await query
  if (error) throw error
}

export const getReadNotificationsMutationKey = () => ['/notifications', 'read'] as const

export function useReadNotificationsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getReadNotificationsMutationKey(),
    mutationFn: readNotificationsService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getNotificationsQueryKeyPrefix() }),
  })
}
