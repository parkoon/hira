import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import type { TaskActor } from '@/features/tasks/api/types'
import { SUBTASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { FilterBar, type FilterBarField, toChipValue } from '@/shared/components/ui/filter-bar'
import { toEnumOptions } from '@/shared/utils/enum'

import { MY_TASK_DEFAULT_SORT, MY_TASK_SORT_META } from '../_constants'
import { myTaskFilterParsers } from '../_utils/my-task-filters'

/** 작업자 옵션은 필터 적용 전 목록에서 뽑아야 선택 후에도 목록이 줄지 않는다. */
export function MyTaskFilters({ assignees }: { assignees: TaskActor[] }) {
  const [filters, setFilters] = useQueryStates(myTaskFilterParsers)

  const filterFields = useMemo<FilterBarField[]>(
    () => [
      { key: 'status', label: '상태', options: toEnumOptions(SUBTASK_STATUS_META) },
      {
        key: 'assignee',
        label: '작업자',
        options: assignees.map((actor) => ({ value: actor.id, label: actor.name })),
      },
      { key: 'sort', label: '정렬', multiple: false, options: toEnumOptions(MY_TASK_SORT_META) },
    ],
    [assignees]
  )

  return (
    <FilterBar
      fields={filterFields}
      value={{
        status: filters.status,
        assignee: filters.assignee,
        sort: toChipValue(filters.sort, MY_TASK_DEFAULT_SORT),
      }}
      onChange={(value) =>
        void setFilters({
          status: value.status ?? [],
          assignee: value.assignee ?? [],
          sort: value.sort?.[0] ?? MY_TASK_DEFAULT_SORT,
        })
      }
      search={filters.q}
      onSearchChange={(q) => void setFilters({ q })}
      searchPlaceholder="작업번호, 제목 검색"
    />
  )
}
