/**
 * 앱이 사용자에게 보여줄 한국어 문구로 직접 던지는 에러.
 * 전역 에러 핸들러(`react-query.ts`)는 이 클래스의 message만 그대로 토스트에 띄운다 —
 * 그 외 Error(PostgrestError, TypeError 등)의 영문 원문이 화면에 새면 안 된다.
 */
export class AppError extends Error {}
