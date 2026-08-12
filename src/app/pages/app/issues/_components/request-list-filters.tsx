import { useQueryStates } from 'nuqs'

import { PRIORITY_META, REQUEST_STATUS_META } from '@/features/issues/constants/metadata'
import { FilterBar, type FilterBarField, toChipValue } from '@/shared/components/ui/filter-bar'
import { toEnumOptions } from '@/shared/utils/enum'

import {
  REQUEST_LIST_DEFAULT_PERIOD,
  REQUEST_LIST_DEFAULT_SORT,
  REQUEST_PERIOD_META,
  REQUEST_SORT_META,
} from '../_constants'
import { requestListFilterParsers } from '../_utils/request-list-filters'

const filterFields: FilterBarField[] = [
  {
    key: 'status',
    label: '상태',
    options: toEnumOptions(REQUEST_STATUS_META, [
      'PENDING_APPROVAL',
      'IN_PROGRESS',
      'DONE',
      'REJECTED',
    ]),
  },
  { key: 'priority', label: '우선순위', options: toEnumOptions(PRIORITY_META) },
  { key: 'period', label: '기간', multiple: false, options: toEnumOptions(REQUEST_PERIOD_META) },
  { key: 'sort', label: '정렬', multiple: false, options: toEnumOptions(REQUEST_SORT_META) },
]

export function RequestListFilters() {
  const [filters, setFilters] = useQueryStates(requestListFilterParsers)

  return (
    <FilterBar
      fields={filterFields}
      value={{
        status: filters.status,
        priority: filters.priority,
        period: toChipValue(filters.period, REQUEST_LIST_DEFAULT_PERIOD),
        sort: toChipValue(filters.sort, REQUEST_LIST_DEFAULT_SORT),
      }}
      onChange={(value) =>
        void setFilters({
          status: value.status ?? [],
          priority: value.priority ?? [],
          period: value.period?.[0] ?? REQUEST_LIST_DEFAULT_PERIOD,
          sort: value.sort?.[0] ?? REQUEST_LIST_DEFAULT_SORT,
        })
      }
      search={filters.q}
      onSearchChange={(q) => void setFilters({ q })}
      searchPlaceholder="이슈번호, 제목 검색"
    />
  )
}
