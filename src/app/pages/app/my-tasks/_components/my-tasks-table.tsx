import type { ColDef } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { TriangleAlertIcon } from 'lucide-react'
import { useMemo } from 'react'

import type { Subtask } from '@/features/tasks/api/types'
import { SubtaskStatusLozenge } from '@/features/tasks/components/subtask-status-lozenge'
import { TaskLink } from '@/features/tasks/components/task-link'
import { SUBTASK_TYPE_META } from '@/features/tasks/constants/metadata'
import { getDueDateStatus } from '@/features/tasks/utils/due-date'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { paths } from '@/shared/config/paths'
import {
  AG_GRID_DEFAULT_COL_DEF,
  AG_GRID_LOCALE,
  AG_GRID_MODULES,
  agGridTheme,
} from '@/shared/lib/ag-grid'
import { cn } from '@/shared/utils/cn'

export function MyTasksTable({ subtasks }: { subtasks: Subtask[] }) {
  const columnDefs = useMemo<ColDef<Subtask>[]>(
    () => [
      {
        field: 'subtaskNo',
        headerName: '작업번호',
        width: 175,
        cellRenderer: ({ data }: { data: Subtask }) => (
          <TaskLink to={paths.app.tasks.subtask.getHref(data.parentTaskNo, data.subtaskNo)}>
            {data.subtaskNo}
          </TaskLink>
        ),
      },
      { field: 'title', headerName: '제목', flex: 1, minWidth: 260 },
      {
        field: 'parentTaskNo',
        headerName: '상위작업',
        width: 150,
        cellRenderer: ({ value }: { value: string }) => (
          <TaskLink to={paths.app.tasks.detail.getHref(value)}>{value}</TaskLink>
        ),
      },
      {
        field: 'type',
        headerName: '유형',
        width: 100,
        cellRenderer: ({ data }: { data: Subtask }) => (
          <Lozenge tone={SUBTASK_TYPE_META[data.type].tone}>
            {SUBTASK_TYPE_META[data.type].label}
          </Lozenge>
        ),
      },
      {
        field: 'status',
        headerName: '상태',
        width: 180,
        cellRenderer: ({ data }: { data: Subtask }) => (
          <SubtaskStatusLozenge status={data.status} />
        ),
      },
      {
        field: 'dueDate',
        headerName: '목표일',
        width: 120,
        cellRenderer: ({ data }: { data: Subtask }) => {
          if (!data.dueDate) return <span className="text-muted-foreground">—</span>

          // 완료된 작업은 목표일이 지났어도 지연으로 강조하지 않는다
          const overdue = data.status !== 'DONE' && getDueDateStatus(data.dueDate).overdue

          return (
            <span
              className={cn('flex items-center gap-1', overdue && 'text-destructive font-medium')}
            >
              {data.dueDate}
              {overdue && <TriangleAlertIcon className="size-3.5" />}
            </span>
          )
        },
      },
      {
        field: 'completedAt',
        headerName: '완료일',
        width: 110,
        cellRenderer: ({ value }: { value: string | null }) =>
          value ?? <span className="text-muted-foreground">—</span>,
      },
    ],
    []
  )

  return (
    <AgGridProvider modules={AG_GRID_MODULES}>
      <div className="min-h-0 w-full flex-1 border-t">
        <AgGridReact<Subtask>
          theme={agGridTheme}
          rowData={subtasks}
          columnDefs={columnDefs}
          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
          localeText={AG_GRID_LOCALE}
        />
      </div>
    </AgGridProvider>
  )
}
