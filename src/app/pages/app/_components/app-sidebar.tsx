import { useSuspenseQuery } from '@tanstack/react-query'
import { ClipboardListIcon, InboxIcon, ListTodoIcon, ScrollTextIcon, UsersIcon } from 'lucide-react'
import * as React from 'react'
import { Link, useLocation } from 'react-router'

import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks'
import { selectMyTurnItems } from '@/features/tasks/utils/my-turn'
import { selectPendingApprovalTasks } from '@/features/tasks/utils/task-selectors'
import type { UserRole } from '@/features/users/api/types'
import { ROLE_LEVEL } from '@/features/users/constants/metadata'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import logo from '@/shared/assets/images/logo.svg'
import logoDark from '@/shared/assets/images/logo-dark.svg'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/shared/components/ui/sidebar'
import { paths } from '@/shared/config/paths'
import { cn } from '@/shared/utils/cn'

type SidebarItem = {
  label: string
  icon: React.ReactNode
  url: string
  minRole?: UserRole
  count?: number
}

function hasAccess(userRole: UserRole, minRole?: UserRole): boolean {
  if (!minRole) return true
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[minRole]
}

function matchesNavItem(pathname: string, item: SidebarItem): boolean {
  return pathname === item.url || pathname.startsWith(`${item.url}/`)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { pathname } = useLocation()
  const { user } = useCurrentUser()
  const role = user.role
  const tasksQuery = useSuspenseQuery(getTasksQueryOptions())
  const tasks = tasksQuery.data

  // 작업 목록이 메인(랜딩)이라 맨 위, 그 아래 뱃지 달린 인박스 둘(내 할 일·승인 대기함)을
  // 붙여 두고, 역할 범위가 좁아지는 순(전 역할 → 리드 → 관리자)으로 내려간다
  const navItems: SidebarItem[] = [
    {
      label: '작업 목록',
      icon: <ClipboardListIcon className="size-4" />,
      url: paths.app.tasks.root.getHref(),
    },
    {
      label: '내 할 일',
      icon: <ListTodoIcon className="size-4" />,
      url: paths.app.myWork.getHref(),
      count: selectMyTurnItems(tasks, user).length,
    },
    {
      label: '승인 대기함',
      icon: <InboxIcon className="size-4" />,
      url: paths.app.approvals.getHref(),
      count: selectPendingApprovalTasks(tasks).length,
      minRole: 'LEAD',
    },
    {
      label: '사용자 관리',
      icon: <UsersIcon className="size-4" />,
      url: paths.app.users.getHref(),
      minRole: 'ADMIN',
    },
    {
      label: '감사 로그',
      icon: <ScrollTextIcon className="size-4" />,
      url: paths.app.auditLogs.getHref(),
      minRole: 'ADMIN',
    },
  ]

  const visibleItems = navItems.filter((item) => hasAccess(role, item.minRole))

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
            >
              <Link to={paths.app.tasks.root.getHref()}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f18d00]">
                  <img
                    src={logo}
                    alt="Hira"
                    className="size-6 object-contain dark:hidden"
                  />
                  <img
                    src={logoDark}
                    alt="Hira"
                    className="hidden size-6 object-contain dark:block"
                  />
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Hira</span>
                  <span className="text-muted-foreground truncate text-xs">현대해상</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {visibleItems.map((item) => (
              <NavItem
                key={item.url}
                item={item}
                pathname={pathname}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

/**
 * Jira 사이드바 활성 상태 — 옅은 강조 배경 + primary 텍스트/아이콘 +
 * 사이드바 왼쪽 끝에 붙는 인디케이터 바.
 * primary 토큰을 쓰므로 라이트/다크가 자동으로 뒤집힌다.
 */
const activeNavItemClass = cn(
  'data-[active=true]:font-semibold',
  'data-[active=true]:bg-primary/10 data-[active=true]:text-primary',
  'data-[active=true]:hover:bg-primary/10 data-[active=true]:hover:text-primary',
  'relative data-[active=true]:before:absolute data-[active=true]:before:-left-2',
  'data-[active=true]:before:top-1/2 data-[active=true]:before:h-4.5 data-[active=true]:before:w-0.5',
  'data-[active=true]:before:-translate-y-1/2 data-[active=true]:before:rounded-r-full',
  'data-[active=true]:before:bg-current'
)

function NavItem({ item, pathname }: { item: SidebarItem; pathname: string }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={matchesNavItem(pathname, item)}
        tooltip={item.label}
        className={activeNavItemClass}
      >
        <Link to={item.url}>
          {item.icon}
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
      {item.count !== undefined && item.count > 0 && (
        <SidebarMenuBadge>{item.count}</SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}
