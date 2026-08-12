import type { ColDef } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'

import type { Request } from '@/features/issues/api/types'
import { IssueKeyLink } from '@/features/issues/components/issue-key-link'
import { PersonalDataLozenge } from '@/features/issues/components/personal-data-lozenge'
import { PriorityLabel } from '@/features/issues/components/priority-label'
import { Button } from '@/shared/components/ui/button'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { paths } from '@/shared/config/paths'
import {
  AG_GRID_DEFAULT_COL_DEF,
  AG_GRID_LOCALE,
  AG_GRID_MODULES,
  agGridTheme,
} from '@/shared/lib/ag-grid'

type ApprovalsTableProps = {
  requests: Request[]
  /** 본인이 등록한 이슈는 본인이 승인/반려할 수 없다 (스펙 §11.1) */
  isSelfRegistered: (request: Request) => boolean
  /** 승인은 결재가 모두 떨어져야 가능하다 (시나리오 3) */
  getApproveState: (request: Request) => { enabled: boolean; reason: string | null }
  onApprove: (request: Request) => void
  onReject: (request: Request) => void
}

export function ApprovalsTable({
  requests,
  isSelfRegistered,
  getApproveState,
  onApprove,
  onReject,
}: ApprovalsTableProps) {
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
        minWidth: 280,
        cellRenderer: ({ data }: { data: Request }) => (
          <span className="flex items-center gap-1.5">
            <span className="truncate">{data.title}</span>
            {data.handlesPersonalData && <PersonalDataLozenge withIcon />}
            {isSelfRegistered(data) && (
              <span className="text-muted-foreground shrink-0 text-[11px]">(본인 등록 건)</span>
            )}
          </span>
        ),
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
        field: 'priority',
        headerName: '우선순위',
        width: 110,
        cellRenderer: ({ data }: { data: Request }) => <PriorityLabel priority={data.priority} />,
      },
      {
        headerName: '액션',
        width: 180,
        sortable: false,
        cellRenderer: ({ data }: { data: Request }) => {
          // 반려는 결재와 무관하게 할 수 있다. 승인만 결재 완료를 기다린다
          const selfRegistered = isSelfRegistered(data)
          const approve = getApproveState(data)

          return (
            <span className="flex h-full items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      size="sm"
                      disabled={!approve.enabled}
                      onClick={() => onApprove(data)}
                    >
                      승인
                    </Button>
                  </span>
                </TooltipTrigger>
                {approve.reason && <TooltipContent>{approve.reason}</TooltipContent>}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={selfRegistered}
                      onClick={() => onReject(data)}
                    >
                      반려
                    </Button>
                  </span>
                </TooltipTrigger>
                {selfRegistered && (
                  <TooltipContent>본인이 등록한 이슈는 직접 반려할 수 없어요</TooltipContent>
                )}
              </Tooltip>
            </span>
          )
        },
      },
    ],
    [isSelfRegistered, getApproveState, onApprove, onReject]
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
          rowClassRules={{
            'bg-red-50 dark:bg-red-950/30': ({ data }) => Boolean(data?.handlesPersonalData),
          }}
        />
      </div>
    </AgGridProvider>
  )
}
