import { parseAsArrayOf, parseAsString } from 'nuqs'

import type { Subtask, SubtaskStatus } from '@/features/issues/api/types'
import { SUBTASK_STATUS_META } from '@/features/issues/constants/metadata'
import { isKnownEnumValue } from '@/shared/utils/enum'

import { MY_TASK_DEFAULT_SORT } from '../_constants'

export const myTaskFilterParsers = {
  q: parseAsString.withDefault(''),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  sort: parseAsString.withDefault(MY_TASK_DEFAULT_SORT),
}

type MyTaskFilters = {
  q: string
  status: string[]
  sort: string
}

/** 진행 중 → 대기 → 완료. 상태별 그룹핑을 쓰던 시절의 노출 순서를 정렬로 옮긴 것 */
function getStatusGroupOrder(status: SubtaskStatus): number {
  if (status === 'DONE') return 3
  if (status === 'TODO') return 2
  return 1
}

/** 목표일 없는 건은 항상 뒤로 */
function compareDueDate(a: Subtask, b: Subtask): number {
  if (!a.dueDate) return b.dueDate ? 1 : 0
  if (!b.dueDate) return -1
  return a.dueDate.localeCompare(b.dueDate)
}

function sortSubtasks(subtasks: Subtask[], sort: string): Subtask[] {
  const sorted = [...subtasks]
  switch (sort) {
    case 'DUE_ASC':
      return sorted.sort(compareDueDate)
    case 'DUE_DESC':
      return sorted.sort((a, b) => -compareDueDate(a, b))
    default:
      return sorted.sort(
        (a, b) =>
          getStatusGroupOrder(a.status) - getStatusGroupOrder(b.status) || compareDueDate(a, b)
      )
  }
}

export function applyMyTaskFilters(subtasks: Subtask[], filters: MyTaskFilters): Subtask[] {
  const query = filters.q.trim().toLowerCase()
  const statuses = filters.status.filter((value) => isKnownEnumValue(SUBTASK_STATUS_META, value))

  const filtered = subtasks.filter((subtask) => {
    if (statuses.length > 0 && !statuses.includes(subtask.status)) {
      return false
    }
    if (query && !`${subtask.issueNo} ${subtask.title}`.toLowerCase().includes(query)) {
      return false
    }
    return true
  })

  return sortSubtasks(filtered, filters.sort)
}
