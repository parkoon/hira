import type { DefaultOptions } from '@tanstack/react-query'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

declare module '@tanstack/react-query' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    mutationMeta: {
      suppressGlobalError?: boolean
    }
  }
}

import { AppError } from './app-error'
import { getSupabaseErrorMessage, isTransportError } from './supabase-error'

// ============================================
// Retry Strategy
// ============================================

/**
 * 재시도 가능한 에러인지 판단.
 * 서버에 닿지 못한 실패만 재시도한다 — PostgREST가 응답을 준 에러는 재시도해도 동일한 결과다.
 */
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  // 최대 3회 재시도
  if (failureCount >= 3) return false

  return isTransportError(error)
}

/**
 * 토스트·에러 화면에 띄울 문구.
 * 앱이 사용자용 문구로 직접 던진 AppError만 message를 그대로 보여주고,
 * Supabase 에러는 옮길 말이 있을 때만 한국어로 바꾼다. 그 외에는 fallback.
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AppError) return error.message
  return getSupabaseErrorMessage(error) ?? fallback
}

/**
 * 지수 백오프 (Exponential Backoff)
 * 1회: 1초, 2회: 2초, 3회: 4초... (최대 30초)
 */
const getRetryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 30000)
}

// ============================================
// Query Cache (전역 에러 핸들링)
// ============================================

const queryCache = new QueryCache({
  onError: (error, query) => {
    // Background refetch 실패 시에만 토스트 표시
    // 초기 로딩 실패는 ErrorBoundary가 처리
    if (query.state.data !== undefined) {
      toast.error(
        getErrorMessage(error, '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      )
    }
  },
})

// ============================================
// Mutation Cache (전역 Mutation 에러 핸들링)
// ============================================

const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    if (mutation.meta?.suppressGlobalError) return
    toast.error(getErrorMessage(error, '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'))
  },
})

// ============================================
// Query Config
// ============================================

export const queryConfig = {
  queries: {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // 1분
    retry: shouldRetry,
    retryDelay: getRetryDelay,
    // ErrorBoundary로 에러 전파 (useSuspenseQuery와 함께 사용)
    throwOnError: true,
  },
} satisfies DefaultOptions

// ============================================
// QueryClient Factory
// ============================================

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: queryConfig,
    queryCache,
    mutationCache,
  })
}
