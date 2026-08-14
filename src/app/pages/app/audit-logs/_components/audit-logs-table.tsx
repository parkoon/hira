import type { ColDef } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'

import type { AuditLog } from '@/features/audit-logs/api/types'
import { AUDIT_EVENT_META } from '@/features/audit-logs/constants/metadata'
import { TaskLink } from '@/features/tasks/components/task-link'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { paths } from '@/shared/config/paths'
import {
  AG_GRID_DEFAULT_COL_DEF,
  AG_GRID_LOCALE,
  AG_GRID_MODULES,
  agGridTheme,
} from '@/shared/lib/ag-grid'

export function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  const columnDefs = useMemo<ColDef<AuditLog>[]>(
    () => [
      { field: 'occurredAt', headerName: '일시', width: 170 },
      { field: 'actorName', headerName: '행위자', width: 110 },
      {
        field: 'eventType',
        headerName: '이벤트',
        width: 150,
        cellRenderer: ({ value }: { value: AuditLog['eventType'] }) => (
          <Lozenge tone={AUDIT_EVENT_META[value].tone}>{AUDIT_EVENT_META[value].label}</Lozenge>
        ),
      },
      {
        field: 'targetLabel',
        headerName: '대상',
        width: 160,
        cellRenderer: ({ data }: { data: AuditLog }) => {
          if (!data.targetLabel) return <span className="text-muted-foreground">—</span>
          if (!data.targetTaskNo) return data.targetLabel
          return (
            <TaskLink to={paths.app.tasks.detail.getHref(data.targetTaskNo)}>
              {data.targetLabel}
            </TaskLink>
          )
        },
      },
      {
        field: 'detail',
        headerName: '상세',
        flex: 1,
        minWidth: 220,
        cellRenderer: ({ value }: { value: string | null }) =>
          value ?? <span className="text-muted-foreground">—</span>,
      },
      {
        field: 'ipAddress',
        headerName: 'IP',
        width: 120,
        // 화면에서 남긴 로그는 브라우저가 IP를 알 수 없어 비어 있다
        cellRenderer: ({ value }: { value: string }) =>
          value || <span className="text-muted-foreground">—</span>,
      },
    ],
    []
  )

  return (
    <AgGridProvider modules={AG_GRID_MODULES}>
      <div className="min-h-0 w-full flex-1 border-t">
        <AgGridReact<AuditLog>
          theme={agGridTheme}
          rowData={logs}
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
