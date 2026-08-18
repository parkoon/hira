import type { ColDef } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'

import type { Task } from '@/features/tasks/api/types'
import { PersonalDataLozenge } from '@/features/tasks/components/personal-data-lozenge'
import { PriorityLabel } from '@/features/tasks/components/priority-label'
import { TaskLink } from '@/features/tasks/components/task-link'
import { TaskStatusLozenge } from '@/features/tasks/components/task-status-lozenge'
import { getSubtaskProgress } from '@/features/tasks/utils/task-selectors'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { paths } from '@/shared/config/paths'
import {
  AG_GRID_DEFAULT_COL_DEF,
  AG_GRID_LOCALE,
  AG_GRID_MODULES,
  agGridTheme,
} from '@/shared/lib/ag-grid'

export function TasksTable({ tasks }: { tasks: Task[] }) {
  const columnDefs = useMemo<ColDef<Task>[]>(
    () => [
      {
        field: 'taskNo',
        headerName: '작업번호',
        width: 140,
        cellRenderer: ({ value }: { value: string }) => (
          <TaskLink to={paths.app.tasks.detail.getHref(value)}>{value}</TaskLink>
        ),
      },
      {
        field: 'title',
        headerName: '제목',
        flex: 1,
        minWidth: 260,
        cellRenderer: ({ data }: { data: Task }) => (
          <span className="flex items-center gap-1.5">
            <span className="truncate">{data.title}</span>
            {data.handlesPersonalData && <PersonalDataLozenge />}
          </span>
        ),
      },
      {
        field: 'status',
        headerName: '상태',
        // '요청 승인 대기중'이 배지·셀 패딩까지 약 120px — 좁으면 배지가 잘린다
        width: 140,
        cellRenderer: ({ data }: { data: Task }) => <TaskStatusLozenge status={data.status} />,
      },
      {
        field: 'priority',
        headerName: '우선순위',
        width: 110,
        cellRenderer: ({ data }: { data: Task }) => <PriorityLabel priority={data.priority} />,
      },
      {
        headerName: '담당자',
        width: 130,
        valueGetter: ({ data }) => data?.requester.name,
        cellRenderer: ({ data }: { data: Task }) => (
          <span className="flex items-center gap-1.5">
            <NameAvatar name={data.requester.name} />
            {data.requester.name}
          </span>
        ),
      },
      { field: 'dueDate', headerName: '완료요청일', width: 120 },
      {
        headerName: '진행률',
        width: 90,
        valueGetter: ({ data }) => {
          if (!data) return null
          const { done, total } = getSubtaskProgress(data)
          return total === 0 ? null : `${done}/${total}`
        },
        cellRenderer: ({ value }: { value: string | null }) =>
          value ?? <span className="text-muted-foreground">—</span>,
      },
    ],
    []
  )

  return (
    <AgGridProvider modules={AG_GRID_MODULES}>
      <div className="min-h-0 w-full flex-1 border-t">
        <AgGridReact<Task>
          theme={agGridTheme}
          rowData={tasks}
          columnDefs={columnDefs}
          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
          localeText={AG_GRID_LOCALE}
          pagination
          paginationPageSize={20}
        />
      </div>
    </AgGridProvider>
  )
}
