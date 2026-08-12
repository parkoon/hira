import type { ColDef } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'

import type { Request } from '@/features/issues/api/types'
import { IssueKeyLink } from '@/features/issues/components/issue-key-link'
import { PersonalDataLozenge } from '@/features/issues/components/personal-data-lozenge'
import { PriorityLabel } from '@/features/issues/components/priority-label'
import { RequestStatusLozenge } from '@/features/issues/components/request-status-lozenge'
import { getSubtaskProgress } from '@/features/issues/utils/issue-selectors'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { paths } from '@/shared/config/paths'
import {
  AG_GRID_DEFAULT_COL_DEF,
  AG_GRID_LOCALE,
  AG_GRID_MODULES,
  agGridTheme,
} from '@/shared/lib/ag-grid'

export function RequestsTable({ requests }: { requests: Request[] }) {
  const columnDefs = useMemo<ColDef<Request>[]>(
    () => [
      {
        field: 'issueNo',
        headerName: '이슈번호',
        width: 140,
        cellRenderer: ({ value }: { value: string }) => (
          <IssueKeyLink to={paths.app.issues.detail.getHref(value)}>{value}</IssueKeyLink>
        ),
      },
      {
        field: 'title',
        headerName: '제목',
        flex: 1,
        minWidth: 260,
        cellRenderer: ({ data }: { data: Request }) => (
          <span className="flex items-center gap-1.5">
            <span className="truncate">{data.title}</span>
            {data.handlesPersonalData && <PersonalDataLozenge />}
          </span>
        ),
      },
      {
        field: 'status',
        headerName: '상태',
        width: 110,
        cellRenderer: ({ data }: { data: Request }) => (
          <RequestStatusLozenge status={data.status} />
        ),
      },
      {
        field: 'priority',
        headerName: '우선순위',
        width: 110,
        cellRenderer: ({ data }: { data: Request }) => <PriorityLabel priority={data.priority} />,
      },
      {
        headerName: '요청자',
        width: 130,
        valueGetter: ({ data }) => data?.requester.name,
        cellRenderer: ({ data }: { data: Request }) => (
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
        <AgGridReact<Request>
          theme={agGridTheme}
          rowData={requests}
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
