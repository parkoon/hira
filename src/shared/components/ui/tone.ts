import type { EnumTone } from '@/shared/utils/enum'

/**
 * 상태 구분 전용 색 — 앱 테마(primary)와 무관하다.
 *
 * 목록의 배지(`Lozenge`)와 상세의 상태 버튼이 같은 상태를 같은 색으로 보여야 해서
 * 팔레트를 여기 한 벌만 둔다. 배지는 읽는 것, 버튼은 누르는 것이라 모양은 서로 다르다.
 */
export const TONE_CLASS: Record<EnumTone, string> = {
  neutral: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}
