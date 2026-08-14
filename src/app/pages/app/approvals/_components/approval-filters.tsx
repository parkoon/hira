import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import { PRIORITY_META } from '@/features/tasks/constants/metadata'
import { FilterBar, type FilterBarField } from '@/shared/components/ui/filter-bar'
import { toEnumOptions } from '@/shared/utils/enum'

import { approvalFilterParsers } from '../_utils/approval-filters'

/** 요청자 옵션은 필터 적용 전 목록에서 뽑아야 선택 후에도 목록이 줄지 않는다. */
export function ApprovalFilters({ requesters }: { requesters: string[] }) {
  const [filters, setFilters] = useQueryStates(approvalFilterParsers)

  const filterFields = useMemo<FilterBarField[]>(
    () => [
      { key: 'priority', label: '우선순위', options: toEnumOptions(PRIORITY_META) },
      {
        key: 'requester',
        label: '요청자',
        options: requesters.map((name) => ({ value: name, label: name })),
      },
    ],
    [requesters]
  )

  return (
    <FilterBar
      fields={filterFields}
      value={{ priority: filters.priority, requester: filters.requester }}
      onChange={(value) =>
        void setFilters({ priority: value.priority ?? [], requester: value.requester ?? [] })
      }
      search={filters.q}
      onSearchChange={(q) => void setFilters({ q })}
      searchPlaceholder="작업번호, 제목 검색"
    />
  )
}
