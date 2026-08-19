import { useQuery } from '@tanstack/react-query'
import { BellIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { getNotificationsQueryOptions } from '@/features/notifications/api/get-notifications'
import { useReadNotificationsMutation } from '@/features/notifications/api/read-notifications'
import type { AppNotification } from '@/features/notifications/api/types'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { cn } from '@/shared/utils/cn'
import { getSubjectParticle } from '@/shared/utils/korean'

/**
 * 헤더의 알림 벨 (Jira의 notification bell).
 * 30초 폴링으로 새 알림을 줍고, 안 읽은 수를 뱃지로 얹는다.
 * 항목을 누르면 읽음 처리 후 대상 레코드로 이동한다.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const notificationsQuery = useQuery(getNotificationsQueryOptions(user.id))
  const readNotifications = useReadNotificationsMutation()

  const notifications = notificationsQuery.data ?? []
  const unreadCount = notifications.filter((notification) => !notification.read).length

  const handleSelect = (notification: AppNotification) => {
    if (!notification.read) {
      readNotifications.mutate({ recipientId: user.id, ids: [notification.id] })
    }
    setOpen(false)
    if (notification.href) void navigate(notification.href)
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unreadCount > 0 ? `알림 ${unreadCount}건 안 읽음` : '알림'}
          className="relative"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="bg-destructive absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 p-0"
      >
        <div className="flex items-center border-b px-3 py-2">
          <span className="text-sm font-semibold">알림</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground ml-auto h-7 px-2 text-xs"
            disabled={unreadCount === 0 || readNotifications.isPending}
            onClick={() => readNotifications.mutate({ recipientId: user.id })}
          >
            모두 읽음
          </Button>
        </div>

        {notifications.length === 0 ? (
          <p className="text-muted-foreground px-3 py-8 text-center text-[13px]">
            알림이 없습니다. 내 작업에 움직임이 생기면 여기로 옵니다.
          </p>
        ) : (
          <div className="divide-border max-h-[420px] divide-y overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleSelect(notification)}
                className={cn(
                  'hover:bg-muted/60 flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors',
                  !notification.read && 'bg-primary/5'
                )}
              >
                <NameAvatar name={notification.actorName} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-snug break-words">
                    <span className="font-semibold">{notification.actorName}</span>
                    {`${getSubjectParticle(notification.actorName)} ${notification.message}`}
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    {notification.createdAt}
                  </span>
                </span>
                {/* Jira의 파란 점 — 안 읽음 표시 */}
                {!notification.read && (
                  <span
                    aria-hidden
                    className="bg-primary mt-1.5 size-2 shrink-0 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
