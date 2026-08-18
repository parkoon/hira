import { useSuspenseQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks'
import { selectVisibleTasks } from '@/features/tasks/utils/task-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Page } from '@/shared/components/ui/layout/page'

import { MyTaskFilters } from './_components/my-task-filters'
import { MyTasksTable } from './_components/my-tasks-table'
import { applyMyTaskFilters, myTaskFilterParsers } from './_utils/my-task-filters'

/** 화면 9 — 하위작업 (작업자) */
function MyTasksPage() {
  const { user } = useCurrentUser()
  const [filters] = useQueryStates(myTaskFilterParsers)
  const tasksQuery = useSuspenseQuery(getTasksQueryOptions())

  // 열람 권한은 작업 목록과 같은 규칙을 쓴다 — 볼 수 없는 작업의 하위작업도 보이면 안 된다
  const visibleTasks = useMemo(
    () => selectVisibleTasks(tasksQuery.data, user),
    [tasksQuery.data, user]
  )

  const allSubtasks = useMemo(() => visibleTasks.flatMap((task) => task.subtasks), [visibleTasks])

  /** 묶음 머리글 행은 합성 행이라 데이터가 없다 — 작업 쪽 값은 여기서 조회한다 */
  const parentTasks = useMemo(
    () => new Map(visibleTasks.map((task) => [task.taskNo, task])),
    [visibleTasks]
  )

  const assignees = useMemo(() => {
    const byId = new Map(allSubtasks.map((subtask) => [subtask.assignee.id, subtask.assignee]))
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [allSubtasks])

  const subtasks = useMemo(() => applyMyTaskFilters(allSubtasks, filters), [allSubtasks, filters])

  return (
    <Page noContentPadding>
      <div className="my-3 px-2">
        <MyTaskFilters assignees={assignees} />
      </div>
      <MyTasksTable
        subtasks={subtasks}
        parentTasks={parentTasks}
      />
    </Page>
  )
}

export { MyTasksPage as Component }
