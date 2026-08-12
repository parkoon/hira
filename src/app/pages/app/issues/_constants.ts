import type { EnumMetadata } from '@/shared/utils/enum'

export const REQUEST_LIST_SEARCH_PARAMS = {
  status: 'status',
  priority: 'priority',
  period: 'period',
  sort: 'sort',
} as const

/** URL 파서 기본값이자 필터 칩의 "미적용" 기준. 파서와 칩 매핑이 함께 참조한다. */
export const REQUEST_LIST_DEFAULT_PERIOD = 'ALL'
export const REQUEST_LIST_DEFAULT_SORT = 'CREATED_DESC'

export const REQUEST_PERIOD_META = {
  '1M': { label: '최근 1개월', order: 10 },
  '3M': { label: '최근 3개월', order: 20 },
  '6M': { label: '최근 6개월', order: 30 },
  ALL: { label: '전체 기간', order: 40 },
} satisfies Record<string, EnumMetadata>

export const REQUEST_SORT_META = {
  CREATED_DESC: { label: '등록일 ↓', order: 10 },
  CREATED_ASC: { label: '등록일 ↑', order: 20 },
  DUE_ASC: { label: '완료요청일 ↑', order: 30 },
  PRIORITY_DESC: { label: '우선순위 높은 순', order: 40 },
} satisfies Record<string, EnumMetadata>

export const REQUEST_PERIOD_MONTHS: Record<string, number | null> = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  ALL: null,
}
