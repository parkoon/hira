import type { AxiosError, AxiosInstance } from 'axios'

import { ApiError, normalizeApiErrorResponse } from './error'

const resolveRedirectUrl = (redirectUrl: string) => {
  try {
    const resolvedUrl = new URL(redirectUrl, window.location.origin)

    resolvedUrl.searchParams.set('returnUrl', window.location.href)

    return resolvedUrl.toString()
  } catch {
    return redirectUrl
  }
}

/**
 * Axios 인스턴스에 API 공통 인터셉터를 설정합니다.
 * - Request: JSON 응답 헤더 설정
 * - Response: 401 시 서버 로그인 화면 이동
 * - Response: API 에러 형태 표준화
 */
export function setupApiInterceptors(instance: AxiosInstance) {
  // Request interceptor
  instance.interceptors.request.use((requestConfig) => {
    requestConfig.headers.Accept = 'application/json'

    return requestConfig
  })

  // Response interceptor — API envelope { success, data, error } 에서 data만 추출
  instance.interceptors.response.use(
    (response) => {
      const body = response.data
      if (body && typeof body === 'object' && 'data' in body) {
        response.data = body.data
      }
      return response
    },
    (error: AxiosError<unknown>) => {
      const statusCode = error.response?.status ?? 500
      const data = error.response?.data
      const apiError = new ApiError(
        normalizeApiErrorResponse({
          response: data,
          statusCode,
          fallbackMessage: error.message,
        })
      )

      const redirectUrl = apiError.fields[0]?.message

      if (statusCode === 401 && redirectUrl) {
        window.location.href = resolveRedirectUrl(redirectUrl)

        // 곧 페이지가 이동되므로 요청을 pending 상태로 두어 401 에러 화면이 잠깐 보이지 않게 합니다.
        return new Promise<never>(() => undefined)
      }

      return Promise.reject(apiError)
    }
  )
}
