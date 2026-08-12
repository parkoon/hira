import { createBrowserRouter, Navigate, Outlet } from 'react-router'

import { AppRouteErrorBoundary } from '@/shared/components/errors/route-error-boundaries'
import { paths } from '@/shared/config/paths'

import { RequireRole } from './pages/app/_components/require-role'
import AppRootLayout from './pages/app/layout'

export const createAppRouter = () =>
  createBrowserRouter([
    {
      path: paths.home.path,
      element: (
        <Navigate
          to={paths.login.getHref()}
          replace
        />
      ),
    },
    {
      path: paths.login.path,
      lazy: () => import('./pages/login/page'),
    },
    {
      path: paths.app.root.path,
      element: <AppRootLayout />,
      children: [
        {
          element: <Outlet />,
          ErrorBoundary: AppRouteErrorBoundary,
          children: [
            {
              index: true,
              element: (
                <Navigate
                  to={paths.app.issues.root.getHref()}
                  replace
                />
              ),
            },
            {
              path: paths.app.issues.root.path,
              lazy: () => import('./pages/app/issues/page'),
            },
            {
              path: paths.app.issues.detail.path,
              lazy: () => import('./pages/app/issues/detail/page'),
            },
            {
              path: paths.app.issues.subtask.path,
              lazy: () => import('./pages/app/subtasks/detail/page'),
            },
            // 아래 화면들은 역할이 모자라면 열리지 않는다 — 사이드바 노출 조건과 같은 기준
            {
              element: <RequireRole minRole="WORKER" />,
              children: [
                {
                  path: paths.app.myTasks.path,
                  lazy: () => import('./pages/app/my-tasks/page'),
                },
              ],
            },
            {
              element: <RequireRole minRole="LEAD" />,
              children: [
                {
                  path: paths.app.approvals.path,
                  lazy: () => import('./pages/app/approvals/page'),
                },
              ],
            },
            {
              element: <RequireRole minRole="ADMIN" />,
              children: [
                {
                  path: paths.app.users.path,
                  lazy: () => import('./pages/app/users/page'),
                },
                {
                  path: paths.app.auditLogs.path,
                  lazy: () => import('./pages/app/audit-logs/page'),
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: '*',
      lazy: () => import('./pages/not-found'),
    },
  ])
