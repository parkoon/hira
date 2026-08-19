import { differenceInCalendarDays, parseISO } from 'date-fns'

import type { EnumTone } from '@/shared/utils/enum'

/**
 * 목표일까지 남은 일수를 Jira D-day 표기로 변환한다.
 * 임박(7일 이내)·초과 여부를 tone으로 함께 돌려준다.
 */
export function getDueDateStatus(dueDate: string) {
  const remainingDays = differenceInCalendarDays(parseISO(dueDate), new Date())

  const label =
    remainingDays === 0 ? 'D-DAY' : remainingDays > 0 ? `D-${remainingDays}` : `D+${-remainingDays}`

  const tone: EnumTone = remainingDays < 0 ? 'danger' : remainingDays <= 7 ? 'warning' : 'neutral'

  return { remainingDays, label, tone, overdue: remainingDays < 0 }
}
