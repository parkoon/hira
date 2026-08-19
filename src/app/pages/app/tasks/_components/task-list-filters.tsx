import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import type { User } from '@/features/users/api/types'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { FilterBar, type FilterBarField, toChipValue } from '@/shared/components/ui/filter-bar'
import { cn } from '@/shared/utils/cn'
import { toEnumOptions } from '@/shared/utils/enum'

import {
  TASK_LIST_DEFAULT_SORT,
  TASK_LIST_DUE_META,
  TASK_LIST_SORT_META,
  TASK_LIST_STATUS_OPTIONS,
} from '../_constants'
import { taskListFilterParsers } from '../_utils/task-list-params'

export function TaskListFilters({ assignees }: { assignees: User[] }) {
  const { user } = useCurrentUser()
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
      { key: 'due', label: '목표일', multiple: false, options: toEnumOptions(TASK_LIST_DUE_META) },
      { key: 'sort', label: '정렬', multiple: false, options: toEnumOptions(TASK_LIST_SORT_META) },
    ],
    [assignees]
  )

  /**
   * Jira 보드의 퀵 필터 — 자주 쓰는 조건을 원터치로 건다.
   * 별도 상태가 아니라 필터 칩과 같은 URL 파라미터를 쓴다 — 버튼으로 걸면 칩이 나타나고,
   * 칩을 지우면 버튼도 꺼진다.
   */
  const quickFilters = [
    {
      label: '내 작업',
      active: filters.assignee === user.id,
      toggle: () =>
        void setFilters({ assignee: filters.assignee === user.id ? '' : user.id, page: 1 }),
    },
    {
      label: '지연',
      active: filters.due === 'overdue',
      toggle: () => void setFilters({ due: filters.due === 'overdue' ? '' : 'overdue', page: 1 }),
    },
    {
      label: '임박(7일)',
      active: filters.due === 'soon',
      toggle: () => void setFilters({ due: filters.due === 'soon' ? '' : 'soon', page: 1 }),
    },
  ]

  return (
    // 줄바꿈 대신 가로 스크롤 — 필터가 늘어도 그리드 높이를 갉아먹지 않는다.
    // 자식까지 shrink를 막아야 눌리지 않고 실제로 넘쳐서 스크롤이 생긴다.
    <div className="flex flex-nowrap items-center gap-1.5 [&>*]:shrink-0">
      <FilterBar
        fields={filterFields}
        value={{
          status: filters.status,
          assignee: toChipValue(filters.assignee, ''),
          due: toChipValue(filters.due, ''),
          sort: toChipValue(filters.sort, TASK_LIST_DEFAULT_SORT),
        }}
        // 조건이 바뀌면 항상 첫 페이지로 돌아간다 — 3페이지에서 범위를 좁히면 빈 화면이 된다
        onChange={(value) =>
          void setFilters({
            status: value.status ?? [],
            assignee: value.assignee?.[0] ?? '',
            due: value.due?.[0] ?? '',
            sort: value.sort?.[0] ?? TASK_LIST_DEFAULT_SORT,
            page: 1,
          })
        }
        search={filters.q}
        onSearchChange={(q) => void setFilters({ q, page: 1 })}
        searchPlaceholder="작업번호, 제목 검색"
        className="flex-nowrap [&>*]:shrink-0"
      />

      <div className="bg-border h-4 w-px" />

      {quickFilters.map((quick) => (
        <Button
          key={quick.label}
          variant="ghost"
          aria-pressed={quick.active}
          className={cn(
            'h-7 px-2 text-xs',
            quick.active &&
              'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary font-semibold'
          )}
          onClick={quick.toggle}
        >
          {quick.label}
        </Button>
      ))}
    </div>
  )
}
