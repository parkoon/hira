import { useSuspenseQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks'
import { selectVisibleTasks } from '@/features/tasks/utils/task-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Page } from '@/shared/components/ui/layout/page'

import { TaskListFilters } from './_components/task-list-filters'
import { TasksTable } from './_components/tasks-table'
import { applyTaskListFilters, taskListFilterParsers } from './_utils/task-list-filters'

/** 화면 2 — 작업 목록 (스펙 §6-2) */
function TaskListPage() {
  const { user } = useCurrentUser()
  const [filters] = useQueryStates(taskListFilterParsers)
  const tasksQuery = useSuspenseQuery(getTasksQueryOptions())

  const tasks = useMemo(
    () => applyTaskListFilters(selectVisibleTasks(tasksQuery.data, user), filters),
    [tasksQuery.data, user, filters]
  )

  return (
    <Page noContentPadding>
      <div className="mb-3 px-2 pt-3">
        <TaskListFilters />
      </div>
      <TasksTable tasks={tasks} />
    </Page>
  )
}

export { TaskListPage as Component }
