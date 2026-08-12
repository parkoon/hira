import type { EnumMetadata } from '@/shared/utils/enum'

/** URL 파서 기본값이자 필터 칩의 "미적용" 기준. 파서와 칩 매핑이 함께 참조한다. */
export const MY_TASK_DEFAULT_SORT = 'PROGRESS'

export const MY_TASK_SORT_META = {
  PROGRESS: { label: '진행 상태 순', order: 10 },
  DUE_ASC: { label: '목표일 ↑', order: 20 },
  DUE_DESC: { label: '목표일 ↓', order: 30 },
} satisfies Record<string, EnumMetadata>
