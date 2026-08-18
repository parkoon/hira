import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import type { User } from '@/features/users/api/types'
import { FilterBar, type FilterBarField, toChipValue } from '@/shared/components/ui/filter-bar'
import { toEnumOptions } from '@/shared/utils/enum'

import {
  TASK_LIST_DEFAULT_SORT,
  TASK_LIST_SORT_META,
  TASK_LIST_STATUS_OPTIONS,
} from '../_constants'
import { taskListFilterParsers } from '../_utils/task-list-params'

export function TaskListFilters({ assignees }: { assignees: User[] }) {
  const [filters, setFilters] = useQueryStates(taskListFilterParsers)

  const filterFields = useMemo<FilterBarField[]>(
    () => [
      { key: 'status', label: '상태', options: TASK_LIST_STATUS_OPTIONS },
      {
        key: 'assignee',
        label: '담당자',
        multiple: false,
        options: assignees.map((user) => ({ value: user.id, label: user.name })),
      },
      { key: 'sort', label: '정렬', multiple: false, options: toEnumOptions(TASK_LIST_SORT_META) },
    ],
    [assignees]
  )

  return (
    <FilterBar
      fields={filterFields}
      value={{
        status: filters.status,
        assignee: toChipValue(filters.assignee, ''),
        sort: toChipValue(filters.sort, TASK_LIST_DEFAULT_SORT),
      }}
      // 조건이 바뀌면 항상 첫 페이지로 돌아간다 — 3페이지에서 범위를 좁히면 빈 화면이 된다
      onChange={(value) =>
        void setFilters({
          status: value.status ?? [],
          assignee: value.assignee?.[0] ?? '',
          sort: value.sort?.[0] ?? TASK_LIST_DEFAULT_SORT,
          page: 1,
        })
      }
      search={filters.q}
      onSearchChange={(q) => void setFilters({ q, page: 1 })}
      searchPlaceholder="작업번호, 제목 검색"
    />
  )
}
