import { queryOptions } from '@tanstack/react-query'
import { format } from 'date-fns'

import type { AppNotification } from '@/features/notifications/api/types'
import { paths } from '@/shared/config/paths'
import { supabase } from '@/shared/lib/supabase'
import type { Database } from '@/shared/types/database'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

const toNotification = (row: NotificationRow): AppNotification => ({
  id: row.id,
  actorName: row.actor_name,
  message: row.message,
  read: row.read_at !== null,
  createdAt: format(new Date(row.created_at), 'yyyy-MM-dd HH:mm'),
  href:
    row.task_no === null
      ? null
      : row.subtask_no === null
        ? paths.app.tasks.detail.getHref(row.task_no)
        : paths.app.tasks.subtask.getHref(row.task_no, row.subtask_no),
})

/** 벨이 보여줄 만큼만 — 오래된 알림을 뒤지는 화면은 따로 없다 */
const NOTIFICATION_LIMIT = 30

export const getNotificationsService = async (recipientId: string): Promise<AppNotification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('id', { ascending: false })
    .limit(NOTIFICATION_LIMIT)
  if (error) throw error
  return data.map(toNotification)
}

export const getNotificationsQueryKeyPrefix = () => ['/notifications'] as const

export const getNotificationsQueryKey = (recipientId: string) =>
  [...getNotificationsQueryKeyPrefix(), recipientId] as const

export const getNotificationsQueryOptions = (recipientId: string) =>
  queryOptions({
    queryKey: getNotificationsQueryKey(recipientId),
    queryFn: () => getNotificationsService(recipientId),
    // 실시간 채널 없이 폴링으로 새 알림을 줍는다 — 30초면 데모 체감에 충분하다
    refetchInterval: 30_000,
    staleTime: 0,
    // 벨은 화면 어디에나 떠 있다 — 알림 조회가 죽어도 화면 전체를 무너뜨리지 않는다
    throwOnError: false,
  })
