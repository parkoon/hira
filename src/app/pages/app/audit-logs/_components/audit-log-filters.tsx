import { useQueryStates } from 'nuqs'

import { AUDIT_EVENT_META, AUDIT_PERIOD_META } from '@/features/audit-logs/constants/metadata'
import { FilterBar, type FilterBarField, toChipValue } from '@/shared/components/ui/filter-bar'
import { toEnumOptions } from '@/shared/utils/enum'

import { AUDIT_LOG_DEFAULT_PERIOD, auditLogFilterParsers } from '../_utils/audit-log-filters'

export function AuditLogFilters({ actors }: { actors: string[] }) {
  const [filters, setFilters] = useQueryStates(auditLogFilterParsers)

  const filterFields: FilterBarField[] = [
    { key: 'period', label: '기간', multiple: false, options: toEnumOptions(AUDIT_PERIOD_META) },
    {
      key: 'actor',
      label: '사용자',
      options: actors.map((name) => ({ value: name, label: name })),
    },
    { key: 'event', label: '이벤트', options: toEnumOptions(AUDIT_EVENT_META) },
  ]

  return (
    <FilterBar
      fields={filterFields}
      value={{
        period: toChipValue(filters.period, AUDIT_LOG_DEFAULT_PERIOD),
        actor: filters.actor,
        event: filters.event,
      }}
      onChange={(value) =>
        void setFilters({
          period: value.period?.[0] ?? AUDIT_LOG_DEFAULT_PERIOD,
          actor: value.actor ?? [],
          event: value.event ?? [],
        })
      }
      search={filters.taskNo}
      onSearchChange={(taskNo) => void setFilters({ taskNo })}
      searchPlaceholder="작업번호 검색"
      // 줄바꿈 대신 가로 스크롤 — 필터가 늘어도 표 높이를 갉아먹지 않는다.
      // 자식까지 shrink를 막아야 눌리지 않고 실제로 넘쳐서 스크롤이 생긴다.
      className="flex-nowrap [&>*]:shrink-0"
    />
  )
}
