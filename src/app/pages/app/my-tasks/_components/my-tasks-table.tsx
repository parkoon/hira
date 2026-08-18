import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { TriangleAlertIcon } from 'lucide-react'
import { useMemo } from 'react'

import type { Subtask, Task } from '@/features/tasks/api/types'
import { SubtaskStatusLozenge } from '@/features/tasks/components/subtask-status-lozenge'
import { TaskLink } from '@/features/tasks/components/task-link'
import { TaskStatusLozenge } from '@/features/tasks/components/task-status-lozenge'
import { getDueDateStatus } from '@/features/tasks/utils/due-date'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { paths } from '@/shared/config/paths'
import {
  AG_GRID_DEFAULT_COL_DEF,
  AG_GRID_LOCALE,
  AG_GRID_MODULES,
  agGridTheme,
} from '@/shared/lib/ag-grid'
import { cn } from '@/shared/utils/cn'

type MyTasksTableProps = {
  subtasks: Subtask[]
  /** 묶음 머리글 행이 조회할 상위작업 (taskNo → Task) */
  parentTasks: Map<string, Task>
}

const EmptyCell = () => <span className="text-muted-foreground">—</span>

const PersonCell = ({ name }: { name: string }) => (
  <span className="flex items-center gap-1.5">
    <NameAvatar name={name} />
    {name}
  </span>
)

/**
 * 하위작업을 상위작업으로 묶어 보여준다. 머리글 행과 하위작업 행이 같은 컬럼을 쓰되
 * 각 컬럼이 행 종류에 따라 작업 값 / 하위작업 값을 고른다.
 *
 * 묶음 머리글은 합성 행이라 `data`가 없고 `node.key`(= parentTaskNo)만 있다.
 * 그래서 작업 쪽 값은 `parentTasks`에서 조회하고, 셀 렌더러 파라미터는 반드시
 * `ICellRendererParams`(data가 optional)로 받는다 — 직접 `{ data: Subtask }`로 적으면
 * 타입 체커를 통과하고 런타임에 터진다.
 */
export function MyTasksTable({ subtasks, parentTasks }: MyTasksTableProps) {
  const columnDefs = useMemo<ColDef<Subtask>[]>(() => {
    /** 묶음 머리글 행이면 해당 작업을, 하위작업 행이면 undefined를 준다 */
    const groupTask = ({ node }: ICellRendererParams<Subtask>) =>
      node.group ? parentTasks.get(node.key ?? '') : undefined

    return [
      { field: 'parentTaskNo', rowGroup: true, hide: true },
      {
        field: 'title',
        headerName: '제목',
        flex: 1,
        minWidth: 160,
        cellRenderer: (params: ICellRendererParams<Subtask>) => {
          const task = groupTask(params)
          if (task) return <span className="font-medium">{task.title}</span>
          return params.data?.title ?? null
        },
      },
      {
        field: 'status',
        headerName: '상태',
        width: 130,
        cellRenderer: (params: ICellRendererParams<Subtask>) => {
          const task = groupTask(params)
          if (task) return <TaskStatusLozenge status={task.status} />
          if (!params.data) return null
          return <SubtaskStatusLozenge status={params.data.status} />
        },
      },
      {
        colId: 'person',
        headerName: '담당자',
        width: 120,
        cellRenderer: (params: ICellRendererParams<Subtask>) => {
          const task = groupTask(params)
          if (task) return <PersonCell name={task.requester.name} />
          if (!params.data) return null
          return <PersonCell name={params.data.assignee.name} />
        },
      },
      {
        field: 'dueDate',
        headerName: '목표일',
        width: 110,
        cellRenderer: (params: ICellRendererParams<Subtask>) => {
          const task = groupTask(params)
          if (task) return task.dueDate

          const subtask = params.data
          if (!subtask) return null
          if (!subtask.dueDate) return <EmptyCell />

          // 완료된 작업은 목표일이 지났어도 지연으로 강조하지 않는다
          const overdue = subtask.status !== 'DONE' && getDueDateStatus(subtask.dueDate).overdue

          return (
            <span
              className={cn('flex items-center gap-1', overdue && 'text-destructive font-medium')}
            >
              {subtask.dueDate}
              {overdue && <TriangleAlertIcon className="size-3.5" />}
            </span>
          )
        },
      },
    ]
  }, [parentTasks])

  /** 계층이 붙는 첫 컬럼 — 머리글 행은 작업번호, 하위작업 행은 하위작업번호를 든다 */
  const autoGroupColumnDef = useMemo<ColDef<Subtask>>(
    () => ({
      headerName: '작업번호',
      field: 'subtaskNo',
      minWidth: 200,
      cellRendererParams: {
        innerRenderer: ({ node, data }: ICellRendererParams<Subtask>) => {
          if (node.group) {
            const taskNo = node.key ?? ''
            return <TaskLink to={paths.app.tasks.detail.getHref(taskNo)}>{taskNo}</TaskLink>
          }
          if (!data) return null
          return (
            <TaskLink to={paths.app.tasks.subtask.getHref(data.parentTaskNo, data.subtaskNo)}>
              {data.subtaskNo}
            </TaskLink>
          )
        },
      },
    }),
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
          autoGroupColumnDef={autoGroupColumnDef}
          // 접힌 채로 시작하면 아무것도 안 보인다
          groupDefaultExpanded={-1}
        />
      </div>
    </AgGridProvider>
  )
}
