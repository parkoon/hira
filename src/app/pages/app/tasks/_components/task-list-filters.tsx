import { useQueryStates } from 'nuqs'

import { PRIORITY_META, TASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { FilterBar, type FilterBarField, toChipValue } from '@/shared/components/ui/filter-bar'
import { toEnumOptions } from '@/shared/utils/enum'

import {
  TASK_LIST_DEFAULT_PERIOD,
  TASK_LIST_DEFAULT_SORT,
  TASK_PERIOD_META,
  TASK_SORT_META,
} from '../_constants'
import { taskListFilterParsers } from '../_utils/task-list-filters'

const filterFields: FilterBarField[] = [
  {
    key: 'status',
    label: '상태',
    options: toEnumOptions(TASK_STATUS_META, [
      'PENDING_APPROVAL',
      'IN_PROGRESS',
      'DONE',
      'REJECTED',
    ]),
  },
  { key: 'priority', label: '우선순위', options: toEnumOptions(PRIORITY_META) },
  { key: 'period', label: '기간', multiple: false, options: toEnumOptions(TASK_PERIOD_META) },
  { key: 'sort', label: '정렬', multiple: false, options: toEnumOptions(TASK_SORT_META) },
]

export function TaskListFilters() {
  const [filters, setFilters] = useQueryStates(taskListFilterParsers)

  return (
    <FilterBar
      fields={filterFields}
      value={{
        status: filters.status,
        priority: filters.priority,
        period: toChipValue(filters.period, TASK_LIST_DEFAULT_PERIOD),
        sort: toChipValue(filters.sort, TASK_LIST_DEFAULT_SORT),
      }}
      onChange={(value) =>
        void setFilters({
          status: value.status ?? [],
          priority: value.priority ?? [],
          period: value.period?.[0] ?? TASK_LIST_DEFAULT_PERIOD,
          sort: value.sort?.[0] ?? TASK_LIST_DEFAULT_SORT,
        })
      }
      search={filters.q}
      onSearchChange={(q) => void setFilters({ q })}
      searchPlaceholder="작업번호, 제목 검색"
    />
  )
}
