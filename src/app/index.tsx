import { QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import { lazy, Suspense, useMemo, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { RouterProvider } from 'react-router'

import { Button } from '@/shared/components/ui/button'
import { Toaster } from '@/shared/components/ui/sonner'
import { Spinner } from '@/shared/components/ui/spinner'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { createQueryClient } from '@/shared/lib/react-query'

import { createAppRouter } from './router'

const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools }))
)

export function App() {
  const [queryClient] = useState(() => createQueryClient())
  const router = useMemo(() => createAppRouter(), [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <QueryClientProvider client={queryClient}>
        {/* 다시 시도를 누르면 실패한 쿼리도 함께 초기화되도록 리셋을 이어 붙인다 */}
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={reset}
              fallbackRender={({ error, resetErrorBoundary }) => (
                <div
                  className="flex h-svh flex-col items-center justify-center gap-3 overflow-hidden py-4"
                  role="alert"
                >
                  <h1 className="text-foreground text-xl font-bold">문제가 발생했습니다</h1>
                  <p className="text-muted-foreground">
                    {error.message ?? '알 수 없는 오류가 발생했습니다.'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={resetErrorBoundary}
                  >
                    다시 시도
                  </Button>
                </div>
              )}
            >
              <Suspense
                fallback={
                  <div className="fixed inset-0 flex items-center justify-center">
                    <Spinner />
                  </div>
                }
              >
                <NuqsAdapter>
                  <TooltipProvider>
                    <RouterProvider router={router} />
                  </TooltipProvider>
                </NuqsAdapter>
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
        <Toaster />
        {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
