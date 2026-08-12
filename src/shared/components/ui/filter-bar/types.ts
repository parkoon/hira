import type { EnumOption } from '@/shared/utils/enum'

export type FilterBarField = {
  key: string
  label: string
  options: EnumOption[]
  /** false면 단일선택 — 값을 고르면 교체하고 팝오버를 닫는다. 기본은 멀티선택. */
  multiple?: boolean
}

/** field key → 선택된 값 목록. 키가 없거나 빈 배열이면 해당 필터 미적용. */
export type FilterBarValue = Record<string, string[]>
