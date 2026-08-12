// HTTP 상태 코드별 기본 메시지
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
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

export type ApiErrorField = { field: string; message: string }

export type ApiErrorResponse = {
  success: boolean
  data: unknown
  error: {
    code: string
    message: string
    fields?: ApiErrorField[]
  }
}

export type ApiErrorOptions = {
  message: string
  statusCode: number
  code?: string
  fields?: ApiErrorField[]
  response: ApiErrorResponse
}

export type NormalizeApiErrorResponseOptions = {
  response: unknown
  statusCode: number
  fallbackMessage?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isApiErrorField = (value: unknown): value is ApiErrorField =>
  isRecord(value) && typeof value.field === 'string' && typeof value.message === 'string'

export const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (
    !isRecord(value) ||
    typeof value.success !== 'boolean' ||
    !('data' in value) ||
    !('error' in value)
  ) {
    return false
  }

  const error = value.error

  if (!isRecord(error) || typeof error.code !== 'string' || typeof error.message !== 'string') {
    return false
  }

  return (
    error.fields === undefined ||
    (Array.isArray(error.fields) && error.fields.every(isApiErrorField))
  )
}

export function normalizeApiErrorResponse({
  response,
  statusCode,
  fallbackMessage,
}: NormalizeApiErrorResponseOptions): ApiErrorOptions {
  if (isApiErrorResponse(response)) {
    return {
      message: response.error.message,
      statusCode,
      code: response.error.code,
      fields: response.error.fields ?? [],
      response,
    }
  }

  return {
    message:
      HTTP_ERROR_MESSAGES[statusCode] ??
      fallbackMessage ??
      '알 수 없는 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    statusCode,
    fields: [],
    response: {
      success: false,
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message:
          HTTP_ERROR_MESSAGES[statusCode] ??
          fallbackMessage ??
          '알 수 없는 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        fields: [],
      },
    },
  }
}

// 커스텀 API Error 클래스
export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code?: string
  public readonly fields: ApiErrorField[]
  public readonly response: ApiErrorResponse
  public readonly isApiError = true

  constructor({ message, statusCode, code, fields = [], response }: ApiErrorOptions) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.fields = fields
    this.response = response
  }

  // 401: 인증 필요
  get isUnauthorized(): boolean {
    return this.statusCode === 401
  }

  // 403: 권한 없음
  get isForbidden(): boolean {
    return this.statusCode === 403
  }

  // 404: 리소스 없음
  get isNotFound(): boolean {
    return this.statusCode === 404
  }

  // 422: 유효성 검사 실패
  get isValidationError(): boolean {
    return this.statusCode === 422
  }

  // 5xx: 서버 에러
  get isServerError(): boolean {
    return this.statusCode >= 500
  }
}
