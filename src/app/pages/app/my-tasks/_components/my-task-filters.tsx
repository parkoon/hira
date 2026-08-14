import { useQueryStates } from 'nuqs'

import { SUBTASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { FilterBar, type FilterBarField, toChipValue } from '@/shared/components/ui/filter-bar'
import { toEnumOptions } from '@/shared/utils/enum'

import { MY_TASK_DEFAULT_SORT, MY_TASK_SORT_META } from '../_constants'
import { myTaskFilterParsers } from '../_utils/my-task-filters'

const filterFields: FilterBarField[] = [
  { key: 'status', label: '상태', options: toEnumOptions(SUBTASK_STATUS_META) },
  { key: 'sort', label: '정렬', multiple: false, options: toEnumOptions(MY_TASK_SORT_META) },
]

export function MyTaskFilters() {
  const [filters, setFilters] = useQueryStates(myTaskFilterParsers)

  return (
    <FilterBar
      fields={filterFields}
      value={{
        status: filters.status,
        sort: toChipValue(filters.sort, MY_TASK_DEFAULT_SORT),
      }}
      onChange={(value) =>
        void setFilters({
          status: value.status ?? [],
          sort: value.sort?.[0] ?? MY_TASK_DEFAULT_SORT,
        })
      }
      search={filters.q}
      onSearchChange={(q) => void setFilters({ q })}
      searchPlaceholder="작업번호, 제목 검색"
    />
  )
}
