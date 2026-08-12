/**
 * Supabase 에러 판별 — 전역 에러 처리(`react-query.ts`, `route-error-boundaries.tsx`)가 쓴다.
 *
 * supabase-js는 실패를 두 가지 모양으로 돌려준다.
 *  - PostgREST/DB 에러: `PostgrestError`(Error 상속). `code`에 PGRST*** 또는 SQLSTATE가 들어온다.
 *  - 전송 실패: fetch 거절을 감싼 평범한 객체. `code`가 빈 문자열이고 `status`가 0이다.
 *
 * 둘 다 message가 영문 원문이라 화면에 그대로 띄우지 않는다. 사용자에게 뜻이 통하는
 * 코드만 골라 한국어 문구로 바꾸고, 나머지는 호출 측 기본 문구를 쓴다.
 */

export type SupabaseErrorLike = {
  message: string
  details: string
  hint: string
  code: string
}

/** PostgrestError 인스턴스와 전송 실패 객체가 공통으로 갖는 네 필드로 판별한다 */
export function isSupabaseError(error: unknown): error is SupabaseErrorLike {
  if (typeof error !== 'object' || error === null) return false

  const candidate = error as Record<string, unknown>
  return (
    typeof candidate.message === 'string' &&
    typeof candidate.details === 'string' &&
    typeof candidate.hint === 'string' &&
    typeof candidate.code === 'string'
  )
}

/**
 * 서버에 닿지 못한 실패인지 — 재시도할 가치가 있는 유일한 경우.
 * PostgREST가 응답을 준 에러는 반드시 code를 채우므로, 비어 있으면 fetch 자체가 실패한 것이다.
 * (supabase-js가 fetch 거절을 이 모양으로 감싸주므로 날 TypeError는 여기까지 오지 않는다.)
 */
export function isTransportError(error: unknown): boolean {
  return isSupabaseError(error) && error.code === ''
}

/**
 * 이 앱에서 실제로 날 수 있는 코드만 옮긴다.
 * 제약·정책은 마이그레이션에 정의돼 있고, 여기 없는 코드는 사용자가 손쓸 수 없는 서버 문제다.
 */
const MESSAGE_BY_CODE: Record<string, string> = {
  // 결재 유니크 인덱스, 이슈번호 PK — 동시에 같은 동작을 했을 때
  '23505': '이미 처리된 요청입니다. 화면을 새로고침해 주세요.',
  // evidences/attachments의 소유자 CHECK
  '23514': '허용되지 않는 값이라 저장하지 못했습니다.',
  // RLS 거부
  '42501': '이 작업을 수행할 권한이 없습니다.',
  // 세션 만료
  PGRST301: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
}

/** 사용자에게 보여줄 한국어 문구. 옮길 말이 없으면 null을 돌려주고 호출 측 기본 문구를 쓰게 한다. */
export function getSupabaseErrorMessage(error: unknown): string | null {
  if (isTransportError(error)) {
    return '네트워크에 연결하지 못했습니다. 연결 상태를 확인해 주세요.'
  }
  if (isSupabaseError(error)) {
    return MESSAGE_BY_CODE[error.code] ?? null
  }
  return null
}
