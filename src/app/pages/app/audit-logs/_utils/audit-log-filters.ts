import { isAfter, parseISO, subDays, subMonths } from 'date-fns'
import { parseAsArrayOf, parseAsString } from 'nuqs'

import type { AuditLog } from '@/features/audit-logs/api/types'
import { AUDIT_EVENT_META } from '@/features/audit-logs/constants/metadata'
import { isKnownEnumValue } from '@/shared/utils/enum'

/** URL 파서 기본값이자 기간 칩의 "미적용" 기준. 파서와 칩 매핑이 함께 참조한다. */
export const AUDIT_LOG_DEFAULT_PERIOD = '7D'

export const auditLogFilterParsers = {
  period: parseAsString.withDefault(AUDIT_LOG_DEFAULT_PERIOD),
  actor: parseAsArrayOf(parseAsString).withDefault([]),
  event: parseAsArrayOf(parseAsString).withDefault([]),
  taskNo: parseAsString.withDefault(''),
}

type AuditLogFilters = {
  period: string
  actor: string[]
  event: string[]
  taskNo: string
}

function getPeriodStart(period: string, now: Date): Date | null {
  switch (period) {
    case '7D':
      return subDays(now, 7)
    case '1M':
      return subMonths(now, 1)
    case '3M':
      return subMonths(now, 3)
    default:
      return null
  }
}

export function applyAuditLogFilters(logs: AuditLog[], filters: AuditLogFilters): AuditLog[] {
  const periodStart = getPeriodStart(filters.period, new Date())
  const taskKeyword = filters.taskNo.trim().toLowerCase()
  const events = filters.event.filter((value) => isKnownEnumValue(AUDIT_EVENT_META, value))

  return logs.filter((log) => {
    if (periodStart && !isAfter(parseISO(log.occurredAt.replace(' ', 'T')), periodStart)) {
      return false
    }
    if (filters.actor.length > 0 && !filters.actor.includes(log.actorName)) return false
    if (events.length > 0 && !events.includes(log.eventType)) {
      return false
    }
    if (taskKeyword.length > 0) {
      return (log.targetLabel ?? '').toLowerCase().includes(taskKeyword)
    }
    return true
  })
}
