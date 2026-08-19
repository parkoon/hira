import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { format } from 'date-fns'
import { CircleCheckBigIcon, CornerDownRightIcon } from 'lucide-react'
import { useMemo } from 'react'

import { SubtaskStatusLozenge } from '@/features/tasks/components/subtask-status-lozenge'
import { TaskLink } from '@/features/tasks/components/task-link'
import { TaskStatusLozenge } from '@/features/tasks/components/task-status-lozenge'
import type { MyTurnItem } from '@/features/tasks/utils/my-turn'
import { Empty } from '@/shared/components/ui/empty'
import {
  AG_GRID_DEFAULT_COL_DEF,
  AG_GRID_LOCALE,
  AG_GRID_MODULES,
  agGridTheme,
} from '@/shared/lib/ag-grid'
import { cn } from '@/shared/utils/cn'

export function MyWorkTable({ items }: { items: MyTurnItem[] }) {
  // 자정을 넘겨 켜 둔 화면까지 챙기지 않는다 — 다음 조회 때 다시 계산된다
  const today = format(new Date(), 'yyyy-MM-dd')

  const columnDefs = useMemo<ColDef<MyTurnItem>[]>(
    () => [
      {
        headerName: '번호',
        width: 170,
        cellRenderer: ({ data }: ICellRendererParams<MyTurnItem>) => {
          if (!data) return null
          return (
            <span className="flex items-center gap-1.5">
              {/* 작업 목록의 계층 표기와 같은 신호 — 하위작업 행임을 알린다 */}
              {data.kind === 'subtask' && (
                <CornerDownRightIcon className="text-muted-foreground size-3.5 shrink-0" />
              )}
              <TaskLink to={data.href}>{data.key}</TaskLink>
            </span>
          )
        },
      },
      {
        field: 'title',
        headerName: '제목',
        flex: 1,
        minWidth: 220,
        cellRenderer: ({ value }: { value: string }) => <span className="truncate">{value}</span>,
      },
      {
        field: 'action',
        headerName: '해야 할 일',
        width: 140,
        cellRenderer: ({ value }: { value: string }) => (
          <span className="font-medium">{value}</span>
        ),
      },
      {
        headerName: '상태',
        width: 150,
        cellRenderer: ({ data }: ICellRendererParams<MyTurnItem>) => {
          if (!data) return null
          return data.kind === 'task' ? (
            <TaskStatusLozenge status={data.status} />
          ) : (
            <SubtaskStatusLozenge status={data.status} />
          )
        },
      },
      {
        field: 'dueDate',
        headerName: '목표일',
        width: 110,
        cellRenderer: ({ value }: { value: string | null }) => {
          if (!value) return <span className="text-muted-foreground">—</span>
          // 이 목록에 완료 건은 없다 — 지난 날짜면 곧 지연이다
          return (
            <span className={cn(value < today && 'text-destructive font-medium')}>{value}</span>
          )
        },
      },
    ],
    [today]
  )

  if (items.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center border-t p-6">
        <Empty
          icon={<CircleCheckBigIcon className="size-10 stroke-1" />}
          title="지금 처리할 일이 없습니다"
          description="내 차례가 오면 여기에 쌓입니다."
          className="max-w-md"
        />
      </div>
    )
  }

  return (
    <AgGridProvider modules={AG_GRID_MODULES}>
      <div className="min-h-0 w-full flex-1 border-t">
        <AgGridReact<MyTurnItem>
          theme={agGridTheme}
          rowData={items}
          columnDefs={columnDefs}
          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
          localeText={AG_GRID_LOCALE}
          // 읽기 전용 목록이라 셀을 짚어 할 일이 없다 — 클릭한 칸에 초점 테두리가 남지 않게 한다
          suppressCellFocus
          getRowId={({ data }) => data.key}
        />
      </div>
    </AgGridProvider>
  )
}
