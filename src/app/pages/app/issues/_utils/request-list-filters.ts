import { isAfter, parseISO, subMonths } from 'date-fns'
import { parseAsArrayOf, parseAsString } from 'nuqs'

import type { Request } from '@/features/issues/api/types'
import { PRIORITY_META, REQUEST_STATUS_META } from '@/features/issues/constants/metadata'
import { isKnownEnumValue } from '@/shared/utils/enum'

import {
  REQUEST_LIST_DEFAULT_PERIOD,
  REQUEST_LIST_DEFAULT_SORT,
  REQUEST_PERIOD_MONTHS,
} from '../_constants'

export const requestListFilterParsers = {
  q: parseAsString.withDefault(''),
  status: parseAsArrayOf(parseAsString).withDefault([]),
  priority: parseAsArrayOf(parseAsString).withDefault([]),
  period: parseAsString.withDefault(REQUEST_LIST_DEFAULT_PERIOD),
  sort: parseAsString.withDefault(REQUEST_LIST_DEFAULT_SORT),
}

type RequestListFilters = {
  q: string
  status: string[]
  priority: string[]
  period: string
  sort: string
}

function sortRequests(requests: Request[], sort: string): Request[] {
  const sorted = [...requests]
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

export function applyRequestListFilters(
  requests: Request[],
  filters: RequestListFilters
): Request[] {
  const months = REQUEST_PERIOD_MONTHS[filters.period] ?? null
  const periodStart = months === null ? null : subMonths(new Date(), months)
  const query = filters.q.trim().toLowerCase()
  const statuses = filters.status.filter((value) => isKnownEnumValue(REQUEST_STATUS_META, value))
  const priorities = filters.priority.filter((value) => isKnownEnumValue(PRIORITY_META, value))

  const filtered = requests.filter((request) => {
    if (statuses.length > 0 && !statuses.includes(request.status)) {
      return false
    }
    if (priorities.length > 0 && !priorities.includes(request.priority)) {
      return false
    }
    if (periodStart && !isAfter(parseISO(request.createdAt), periodStart)) {
      return false
    }
    if (query && !`${request.issueNo} ${request.title}`.toLowerCase().includes(query)) {
      return false
    }
    return true
  })

  return sortRequests(filtered, filters.sort)
}
