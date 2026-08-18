import { useQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useEffect, useMemo } from 'react'

import { getTaskTreeQueryOptions } from '@/features/tasks/api/get-task-tree'
import { getUsersQueryOptions } from '@/features/users/api/get-users'
import { Page } from '@/shared/components/ui/layout/page'
import { useDebounceValue } from '@/shared/hooks/use-debounce'

import { TaskTreeFilters } from './_components/task-tree-filters'
import { TaskTreePager } from './_components/task-tree-pager'
import { TaskTreeTable } from './_components/task-tree-table'
import { TASK_TREE_DEFAULT_SORT } from './_constants'
import { normalizeTaskTreeParams, taskTreeFilterParsers } from './_utils/task-tree-params'

/**
 * 계층형 작업 조회 — 작업과 하위작업을 한 그리드에 그룹지어 보여준다.
 *
 * 다른 목록 화면과 달리 검색·필터·정렬·페이징을 전부 서버가 한다. 그래서 전체를 받아
 * 클라이언트에서 거르는 `useSuspenseQuery` 대신, 페이지 단위로 받는 `useQuery`를 쓰고
 * 로딩·빈 상태·에러를 그리드 자리에서 직접 그린다.
 */
function TaskTreePage() {
  const [rawParams, setParams] = useQueryStates(taskTreeFilterParsers)

  // 검색어만 늦춰서 조회에 넣는다 — URL은 타이핑을 그대로 따라가되(공유·뒤로가기가 정확하다),
  // 서버는 손이 멎은 뒤에 한 번만 때린다. 나머지 조건은 한 번의 선택이라 늦출 이유가 없다.
  const debouncedQuery = useDebounceValue(rawParams.q)
  const params = useMemo(
    () => normalizeTaskTreeParams({ ...rawParams, q: debouncedQuery }),
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
    void setParams({ q: '', status: [], assignee: '', sort: TASK_TREE_DEFAULT_SORT, page: 1 })

  return (
    <Page
      className="overflow-y-hidden"
      noContentPadding
    >
      <div className="mb-3 px-2 pt-3">
        <TaskTreeFilters assignees={usersQuery.data ?? []} />
      </div>

      <TaskTreeTable
        content={taskTreeQuery.data?.content ?? []}
        isLoading={taskTreeQuery.isPending}
        isError={taskTreeQuery.isError}
        onRetry={() => void taskTreeQuery.refetch()}
        onResetFilters={resetFilters}
      />

      <TaskTreePager
        page={pageMeta}
        disabled={taskTreeQuery.isPlaceholderData}
        onPageChange={(page) => void setParams({ page })}
      />
    </Page>
  )
}

export { TaskTreePage as Component }
