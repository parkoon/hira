import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useEffect, useMemo } from 'react'

import { getTaskTreeQueryOptions } from '@/features/tasks/api/get-task-tree'
import { TaskCreateModal } from '@/features/tasks/components/task-form/task-create-modal'
import { getUsersQueryOptions } from '@/features/users/api/get-users'
import { Page } from '@/shared/components/ui/layout/page'
import { useDebounceValue } from '@/shared/hooks/use-debounce'

import { TaskListFilters } from './_components/task-list-filters'
import { TaskListPager } from './_components/task-list-pager'
import { TasksTable } from './_components/tasks-table'
import { TASK_LIST_DEFAULT_SORT } from './_constants'
import { normalizeTaskListParams, taskListFilterParsers } from './_utils/task-list-params'

/**
 * 화면 2 — 작업 목록 (스펙 §6-2). 작업과 그 하위작업을 한 그리드에 계층으로 보여준다.
 *
 * 다른 목록 화면과 달리 검색·필터·정렬·페이징을 전부 서버가 한다. 그래서 전체를 받아
 * 클라이언트에서 거르는 `useSuspenseQuery` 대신, 페이지 단위로 받는 `useQuery`를 쓰고
 * 로딩·빈 상태·에러를 그리드 자리에서 직접 그린다.
 */
function TaskListPage() {
  const [rawParams, setParams] = useQueryStates(taskListFilterParsers)

  // 검색어만 늦춰서 조회에 넣는다 — URL은 타이핑을 그대로 따라가되(공유·뒤로가기가 정확하다),
  // 서버는 손이 멎은 뒤에 한 번만 때린다. 나머지 조건은 한 번의 선택이라 늦출 이유가 없다.
  const debouncedQuery = useDebounceValue(rawParams.q)
  const params = useMemo(
    () => normalizeTaskListParams({ ...rawParams, q: debouncedQuery }),
    [rawParams, debouncedQuery]
  )

  const taskTreeQuery = useQuery(getTaskTreeQueryOptions(params))
  const usersQuery = useQuery(getUsersQueryOptions())

  const pageMeta = taskTreeQuery.data?.page

  // 건수가 줄어 마지막 페이지가 사라지면 URL의 page가 범위를 넘는다. 서버는 이를 오류로 보지 않고
  // 빈 목록으로 답하므로, 화면이 마지막 유효 페이지로 되돌린다.
  // 직전 페이지를 비추는 중에는 totalPages가 낡은 값이라 건너뛴다 — 아니면 엉뚱한 곳으로 튄다.
  useEffect(() => {
    if (!pageMeta || taskTreeQuery.isPlaceholderData) return
    if (pageMeta.totalPages > 0 && params.page > pageMeta.totalPages) {
      void setParams({ page: pageMeta.totalPages })
    }
  }, [pageMeta, params.page, taskTreeQuery.isPlaceholderData, setParams])

  const resetFilters = () =>
    void setParams({
      q: '',
      status: [],
      assignee: '',
      due: '',
      sort: TASK_LIST_DEFAULT_SORT,
      page: 1,
    })

  return (
    <Page
      className="overflow-y-hidden"
      noContentPadding
    >
      {/* 필터가 늘면 왼쪽만 가로로 흐르고 작업 요청 버튼은 오른쪽에 붙어 있는다 */}
      <div className="mb-3 flex items-center justify-between gap-2 px-2 pt-3">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <TaskListFilters assignees={usersQuery.data ?? []} />
        </div>
        <TaskCreateModal />
      </div>

      <TasksTable
        content={taskTreeQuery.data?.content ?? []}
        isLoading={taskTreeQuery.isPending}
        isError={taskTreeQuery.isError}
        onRetry={() => void taskTreeQuery.refetch()}
        onResetFilters={resetFilters}
      />

      <TaskListPager
        page={pageMeta}
        disabled={taskTreeQuery.isPlaceholderData}
        onPageChange={(page) => void setParams({ page })}
      />
    </Page>
  )
}

export { TaskListPage as Component }
