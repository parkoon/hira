import { parseAsArrayOf, parseAsString } from 'nuqs'

import type { Request } from '@/features/issues/api/types'
import { PRIORITY_META } from '@/features/issues/constants/metadata'
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

export function applyApprovalFilters(requests: Request[], filters: ApprovalFilters): Request[] {
  const query = filters.q.trim().toLowerCase()
  const priorities = filters.priority.filter((value) => isKnownEnumValue(PRIORITY_META, value))

  return requests.filter((request) => {
    if (priorities.length > 0 && !priorities.includes(request.priority)) {
      return false
    }
    if (filters.requester.length > 0 && !filters.requester.includes(request.requester.name)) {
      return false
    }
    if (query && !`${request.issueNo} ${request.title}`.toLowerCase().includes(query)) {
      return false
    }
    return true
  })
}
