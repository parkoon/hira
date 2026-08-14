import { isAfter, parseISO, subMonths } from 'date-fns'
import { parseAsArrayOf, parseAsString } from 'nuqs'

import type { Task } from '@/features/tasks/api/types'
import { PRIORITY_META, TASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { isKnownEnumValue } from '@/shared/utils/enum'

import { TASK_LIST_DEFAULT_PERIOD, TASK_LIST_DEFAULT_SORT, TASK_PERIOD_MONTHS } from '../_constants'

export const taskListFilterParsers = {
  q: parseAsString.withDefault(''),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  priority: parseAsArrayOf(parseAsString).withDefault([]),
  period: parseAsString.withDefault(TASK_LIST_DEFAULT_PERIOD),
  sort: parseAsString.withDefault(TASK_LIST_DEFAULT_SORT),
}

type TaskListFilters = {
  q: string
  status: string[]
  priority: string[]
  period: string
  sort: string
}

function sortTasks(tasks: Task[], sort: string): Task[] {
  const sorted = [...tasks]
  switch (sort) {
    case 'CREATED_ASC':
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    case 'DUE_ASC':
      return sorted.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    case 'PRIORITY_DESC':
      return sorted.sort(
        (a, b) => PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order
      )
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

export function applyTaskListFilters(tasks: Task[], filters: TaskListFilters): Task[] {
  const months = TASK_PERIOD_MONTHS[filters.period] ?? null
  const periodStart = months === null ? null : subMonths(new Date(), months)
  const query = filters.q.trim().toLowerCase()
  const statuses = filters.status.filter((value) => isKnownEnumValue(TASK_STATUS_META, value))
  const priorities = filters.priority.filter((value) => isKnownEnumValue(PRIORITY_META, value))

  const filtered = tasks.filter((task) => {
    if (statuses.length > 0 && !statuses.includes(task.status)) {
      return false
    }
    if (priorities.length > 0 && !priorities.includes(task.priority)) {
      return false
    }
    if (periodStart && !isAfter(parseISO(task.createdAt), periodStart)) {
      return false
    }
    if (query && !`${task.taskNo} ${task.title}`.toLowerCase().includes(query)) {
      return false
    }
    return true
  })

  return sortTasks(filtered, filters.sort)
}
