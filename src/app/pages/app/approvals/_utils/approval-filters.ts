import { parseAsArrayOf, parseAsString } from 'nuqs'

import type { Task } from '@/features/tasks/api/types'
import { PRIORITY_META } from '@/features/tasks/constants/metadata'
import { isKnownEnumValue } from '@/shared/utils/enum'

export const approvalFilterParsers = {
  q: parseAsString.withDefault(''),
  priority: parseAsArrayOf(parseAsString).withDefault([]),
  requester: parseAsArrayOf(parseAsString).withDefault([]),
}

type ApprovalFilters = {
  q: string
  priority: string[]
  requester: string[]
}

export function applyApprovalFilters(tasks: Task[], filters: ApprovalFilters): Task[] {
  const query = filters.q.trim().toLowerCase()
  const priorities = filters.priority.filter((value) => isKnownEnumValue(PRIORITY_META, value))

  return tasks.filter((task) => {
    if (priorities.length > 0 && !priorities.includes(task.priority)) {
      return false
    }
    if (filters.requester.length > 0 && !filters.requester.includes(task.requester.name)) {
      return false
    }
    if (query && !`${task.taskNo} ${task.title}`.toLowerCase().includes(query)) {
      return false
    }
    return true
  })
}
