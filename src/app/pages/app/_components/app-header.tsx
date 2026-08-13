import { RequestCreateModal } from '@/features/issues/components/request-form/request-create-modal'
import { NavUserButton } from '@/features/users/components/nav-user-button'
import { EnvBadge } from '@/shared/components/env-badge'
import { ThemeButton } from '@/shared/components/theme-button'
import { SidebarTrigger } from '@/shared/components/ui/sidebar'

export function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-2.5" />
      <div className="h-4 border-r" />
      <RequestCreateModal />
      <EnvBadge />
      <div className="ml-auto flex items-center gap-2">
        <ThemeButton />
        <NavUserButton />
      </div>
    </header>
  )
}
