import { useSuspenseQuery } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router'

import { getCurrentUserQueryOptions } from '@/features/users/api/get-current-user'
import { CurrentUserContext } from '@/features/users/hooks/use-current-user'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar'
import { paths } from '@/shared/config/paths'

import { AppHeader } from './_components/app-header'
import { AppSidebar } from './_components/app-sidebar'

export default function AppRootLayout() {
  const currentUserQuery = useSuspenseQuery(getCurrentUserQueryOptions())

  // 앱 화면 안쪽은 로그인한 사용자가 있다고 가정하므로 여기서 막는다
  if (currentUserQuery.data === null) {
    return (
      <Navigate
        to={paths.login.getHref()}
        replace
      />
    )
  }

  return (
    <CurrentUserContext value={currentUserQuery.data}>
      <SidebarProvider className="h-svh! min-h-0!">
        <AppSidebar />
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader />
          <Outlet />
        </SidebarInset>
        <ConfirmDialog />
      </SidebarProvider>
    </CurrentUserContext>
  )
}
