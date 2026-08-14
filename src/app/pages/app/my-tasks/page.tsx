import { useSuspenseQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks'
import { selectSubtasksByAssignee } from '@/features/tasks/utils/task-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Page } from '@/shared/components/ui/layout/page'

import { MyTaskFilters } from './_components/my-task-filters'
import { MyTasksTable } from './_components/my-tasks-table'
import { applyMyTaskFilters, myTaskFilterParsers } from './_utils/my-task-filters'

/** 화면 9 — 내 하위작업 (작업자) */
function MyTasksPage() {
  const { user } = useCurrentUser()
  const [filters] = useQueryStates(myTaskFilterParsers)
  const tasksQuery = useSuspenseQuery(getTasksQueryOptions())

  const subtasks = useMemo(
    () => applyMyTaskFilters(selectSubtasksByAssignee(tasksQuery.data, user.id), filters),
    [tasksQuery.data, user.id, filters]
  )

  return (
    <Page noContentPadding>
      <div className="my-3 px-2">
        <MyTaskFilters />
      </div>
      <MyTasksTable subtasks={subtasks} />
    </Page>
  )
}

export { MyTasksPage as Component }
