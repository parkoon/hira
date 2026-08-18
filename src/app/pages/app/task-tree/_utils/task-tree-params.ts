import { parseAsArrayOf, parseAsInteger, parseAsString } from 'nuqs'

import type { TaskTreeQuery } from '@/features/tasks/api/get-task-tree'
import { SUBTASK_STATUS_META, TASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { isKnownEnumValue } from '@/shared/utils/enum'

import {
  TASK_TREE_DEFAULT_SIZE,
  TASK_TREE_DEFAULT_SORT,
  TASK_TREE_MAX_SIZE,
  TASK_TREE_SORT_META,
} from '../_constants'

/** 검색어·필터·정렬·페이지의 단일 원본은 URL이다. 새로고침·공유·뒤로가기가 이것만으로 복원된다. */
export const taskTreeFilterParsers = {
  page: parseAsInteger.withDefault(1),
  size: parseAsInteger.withDefault(TASK_TREE_DEFAULT_SIZE),
  q: parseAsString.withDefault(''),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  assignee: parseAsString.withDefault(''),
  sort: parseAsString.withDefault(TASK_TREE_DEFAULT_SORT),
}

type RawTaskTreeParams = {
  page: number
  size: number
  q: string
  status: string[]
  assignee: string
  sort: string
}

/**
 * URL search param을 API가 받는 모양으로 정규화한다.
 *
 * 손으로 고친 URL도 화면을 깨뜨리지 않게 여기서 전부 흡수한다 — 범위를 벗어난 페이지·크기는
 * 자르고, 모르는 상태 코드와 정렬 값은 버린다. 검색어만은 손대지 않는다:
 * LIKE 특수문자 이스케이프와 trim은 서버 몫이라 원문 그대로 넘긴다.
 */
export function normalizeTaskTreeParams(raw: RawTaskTreeParams): TaskTreeQuery {
  const status = raw.status.filter(
    (value) =>
      isKnownEnumValue(TASK_STATUS_META, value) || isKnownEnumValue(SUBTASK_STATUS_META, value)
  )

  return {
    page: Math.max(Math.trunc(raw.page) || 1, 1),
    size: Math.min(Math.max(Math.trunc(raw.size) || TASK_TREE_DEFAULT_SIZE, 1), TASK_TREE_MAX_SIZE),
    q: raw.q,
    status,
    assigneeId: raw.assignee.length > 0 ? raw.assignee : null,
    sort: isKnownEnumValue(TASK_TREE_SORT_META, raw.sort) ? raw.sort : TASK_TREE_DEFAULT_SORT,
  }
}
