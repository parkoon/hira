import { NotificationBell } from '@/features/notifications/components/notification-bell'
import { NavUserButton } from '@/features/users/components/nav-user-button'
import { EnvBadge } from '@/shared/components/env-badge'
import { ThemeButton } from '@/shared/components/theme-button'
import { SidebarTrigger } from '@/shared/components/ui/sidebar'

export function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-2.5" />
      <div className="h-4 border-r" />
      <EnvBadge />
      <div className="ml-auto flex items-center gap-2">
        <ThemeButton />
        <NotificationBell />
        <NavUserButton />
      </div>
    </header>
  )
}
