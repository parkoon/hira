import { AlertTriangleIcon, HomeIcon } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import { Button } from '@/shared/components/ui/button'
import { Empty } from '@/shared/components/ui/empty'
import { paths } from '@/shared/config/paths'
import { getSupabaseErrorMessage, isSupabaseError } from '@/shared/lib/supabase-error'

type RouteErrorInfo = {
  title: string
  message: string
}

// HTTP 상태 코드별 기본 메시지 — 라우터가 던지는 Response 에러에만 쓴다
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: '잘못된 요청입니다.',
  401: '로그인이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 리소스를 찾을 수 없습니다.',
  422: '입력값을 확인해 주세요.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버 오류가 발생했습니다.',
  502: '서버에 연결할 수 없습니다.',
  503: '서비스를 일시적으로 사용할 수 없습니다.',
}

const DEFAULT_ERROR_TITLE = '일시적인 오류가 발생했습니다'
const DEFAULT_ERROR_MESSAGE =
  '일시적인 문제로 페이지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'

function getRouteErrorInfo(error: unknown): RouteErrorInfo {
  if (isRouteErrorResponse(error)) {
    const message =
      typeof error.data === 'object' &&
      error.data !== null &&
      'message' in error.data &&
      typeof error.data.message === 'string'
        ? error.data.message
        : typeof error.data === 'string'
          ? error.data
          : error.statusText || HTTP_ERROR_MESSAGES[error.status] || DEFAULT_ERROR_MESSAGE

    return {
      title: getErrorTitle(error.status),
      message,
    }
  }

  // Error보다 먼저 본다 — PostgrestError도 Error라서, 뒤에 두면 영문 원문이 화면에 뜬다
  if (isSupabaseError(error)) {
    return {
      title: DEFAULT_ERROR_TITLE,
      message: getSupabaseErrorMessage(error) ?? DEFAULT_ERROR_MESSAGE,
    }
  }

  if (error instanceof Error) {
    return {
      title: DEFAULT_ERROR_TITLE,
      message: error.message || DEFAULT_ERROR_MESSAGE,
    }
  }

  return {
    title: DEFAULT_ERROR_TITLE,
    message: DEFAULT_ERROR_MESSAGE,
  }
}

function getErrorTitle(statusCode?: number) {
  switch (statusCode) {
    case 401:
      return '로그인이 필요합니다'
    case 403:
      return '접근 권한이 없습니다'
    case 404:
      return '요청한 페이지를 찾을 수 없습니다'
    default:
      return DEFAULT_ERROR_TITLE
  }
}

function ErrorState({ info }: { info: RouteErrorInfo }) {
  return (
    <Empty
      icon={<AlertTriangleIcon className="size-10 stroke-1" />}
      title={info.title}
      description={info.message}
      className="border-none"
    >
      <Button
        asChild
        variant="outline"
      >
        <Link to={paths.app.tasks.root.getHref()}>
          <HomeIcon />
          작업 목록으로 이동
        </Link>
      </Button>
    </Empty>
  )
}

export function AppRouteErrorBoundary() {
  const error = useRouteError()
  const info = getRouteErrorInfo(error)

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
      <div className="flex h-full min-h-[320px] items-center justify-center">
        <ErrorState info={info} />
      </div>
    </main>
  )
}
