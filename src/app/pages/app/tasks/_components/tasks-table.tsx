import type { ColDef, GetRowIdParams, ICellRendererParams, RowClassParams } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { CornerDownRightIcon, SearchXIcon, TriangleAlertIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'

import type { TaskTreeChild, TaskTreeParent } from '@/features/tasks/api/types'
import { SubtaskStatusLozenge } from '@/features/tasks/components/subtask-status-lozenge'
import { TaskLink } from '@/features/tasks/components/task-link'
import { TaskStatusLozenge } from '@/features/tasks/components/task-status-lozenge'
import { Button } from '@/shared/components/ui/button'
import { Empty } from '@/shared/components/ui/empty'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { Spinner } from '@/shared/components/ui/spinner'
import { paths } from '@/shared/config/paths'
import {
  AG_GRID_DEFAULT_COL_DEF,
  AG_GRID_LOCALE,
  AG_GRID_MODULES,
  agGridTheme,
} from '@/shared/lib/ag-grid'
import { cn } from '@/shared/utils/cn'

/** 그리드가 한 행에 싣는 값 — Tree Data는 중첩 응답의 원본 객체를 그대로 넘겨준다 */
type TaskTreeNode = TaskTreeParent | TaskTreeChild

/** 상위만 `children`을 갖는다. 하위는 대신 `parentId`를 갖는다. */
const isParentNode = (node: TaskTreeNode): node is TaskTreeParent => 'children' in node

type TasksTableProps = {
  content: TaskTreeParent[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onResetFilters: () => void
}

const EMPTY_CELL = <span className="text-muted-foreground">—</span>

/**
 * 계층 그리드 — 정렬·필터·페이징이 모두 서버에 있으므로 그리드는 받은 순서 그대로 그리기만 한다.
 *
 * 계층은 Tree Data로 그린다. 서버가 이미 spec 5.3의 중첩 구조로 주므로 변환 없이 rowData에 꽂고,
 * 들여쓰기·펼침 아이콘·접기/펼치기는 그리드가 맡는다.
 * RowGrouping이 아닌 이유는 부모가 그룹 키가 아니라 자기 값을 가진 실제 행이기 때문이다.
 */
export function TasksTable({
  content,
  isLoading,
  isError,
  onRetry,
  onResetFilters,
}: TasksTableProps) {
  /**
   * 계층을 담당하는 그룹 컬럼 — 들여쓰기와 펼침 아이콘이 여기 붙으므로 작업번호를 여기 둔다.
   * Nested Records 방식은 기본 표시값이 row ID라 innerRenderer로 직접 그린다.
   */
  const autoGroupColumnDef = useMemo<ColDef<TaskTreeNode>>(
    () => ({
      headerName: '작업번호',
      // 들여쓰기 한 단 + 펼침 아이콘 + 파생 표시까지 앞에 붙으므로 번호만 놓을 때보다 넉넉해야 한다
      width: 240,
      cellRendererParams: {
        // 하위 건수는 '하위' 컬럼이 이미 보여준다 — 그룹 셀의 (1) 표기는 끈다
        suppressCount: true,
        innerRenderer: ({ data }: ICellRendererParams<TaskTreeNode>) => {
          if (!data) return null

          const isParent = isParentNode(data)
          // 끝난 건은 훑어 내릴 때 걸러 읽히게 죽인다. 링크는 그대로 살아 있다
          const isDone = data.status === 'DONE'

          return (
            <span className="flex items-center gap-1.5">
              {/* 그리드가 들여쓰기로 계층을 이미 보여주지만, 파생된 행이라는 신호를 한 번 더 준다 */}
              {!isParent && (
                <CornerDownRightIcon className="text-muted-foreground size-3.5 shrink-0" />
              )}
              <TaskLink
                to={
                  isParent
                    ? paths.app.tasks.detail.getHref(data.key)
                    : paths.app.tasks.subtask.getHref(data.parentId, data.key)
                }
                className={cn(
                  isDone && 'text-muted-foreground dark:text-muted-foreground line-through'
                )}
              >
                {data.key}
              </TaskLink>
            </span>
          )
        },
      },
    }),
    []
  )

  const columnDefs = useMemo<ColDef<TaskTreeNode>[]>(
    () => [
      {
        headerName: '제목',
        flex: 1,
        minWidth: 220,
        cellRenderer: ({ data }: ICellRendererParams<TaskTreeNode>) => {
          if (!data) return null

          const isParent = isParentNode(data)

          return (
            <span className="flex items-center gap-1.5">
              <span className={cn('truncate', isParent && 'font-medium')}>{data.title}</span>
              {/* 이 행이 왜 결과에 들었는지는 제목 옆에서 읽혀야 한다 */}
              {isParent && !data.matched && <Lozenge tone="info">하위 매칭</Lozenge>}
            </span>
          )
        },
      },
      {
        headerName: '상태',
        width: 140,
        cellRenderer: ({ data }: ICellRendererParams<TaskTreeNode>) => {
          if (!data) return null
          return isParentNode(data) ? (
            <TaskStatusLozenge status={data.status} />
          ) : (
            <SubtaskStatusLozenge status={data.status} />
          )
        },
      },
      {
        headerName: '담당자',
        width: 130,
        cellRenderer: ({ data }: ICellRendererParams<TaskTreeNode>) => {
          if (!data?.assigneeName) return EMPTY_CELL
          return (
            <span className="flex items-center gap-1.5">
              <NameAvatar name={data.assigneeName} />
              {data.assigneeName}
            </span>
          )
        },
      },
      {
        field: 'dueDate',
        headerName: '목표일',
        width: 120,
        // 하위작업은 목표일이 없을 수 있다
        cellRenderer: ({ value }: { value: string | null }) => value ?? EMPTY_CELL,
      },
    ],
    []
  )

  const defaultColDef = useMemo<ColDef>(() => ({ ...AG_GRID_DEFAULT_COL_DEF, sortable: false }), [])

  const rowClassRules = useMemo(
    () => ({
      // 조건에 직접 걸린 행이 아니라 문맥으로 딸려온 행 — 검색 결과처럼 보이면 안 된다
      'opacity-55': ({ data }: RowClassParams<TaskTreeNode>) => data?.matched === false,
    }),
    []
  )

  const getRowId = useCallback(({ data }: GetRowIdParams<TaskTreeNode>) => data.id, [])

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center border-t p-6">
        <Empty
          icon={<TriangleAlertIcon className="size-10 stroke-1" />}
          title="목록을 불러오지 못했습니다"
          description="잠시 후 다시 시도해 주세요."
          className="max-w-md"
        >
          <Button
            variant="outline"
            onClick={onRetry}
          >
            다시 시도
          </Button>
        </Empty>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center gap-2 border-t text-sm">
        <Spinner />
        불러오는 중
      </div>
    )
  }

  if (content.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center border-t p-6">
        <Empty
          icon={<SearchXIcon className="size-10 stroke-1" />}
          title="조건에 맞는 작업이 없습니다"
          description="검색어나 필터를 바꿔 보세요."
          className="max-w-md"
        >
          <Button
            variant="outline"
            onClick={onResetFilters}
          >
            필터 초기화
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <AgGridProvider modules={AG_GRID_MODULES}>
      <div className="min-h-0 w-full flex-1 border-t">
        <AgGridReact<TaskTreeNode>
          theme={agGridTheme}
          rowData={content}
          treeData
          treeDataChildrenField="children"
          autoGroupColumnDef={autoGroupColumnDef}
          // 접힌 채로 시작하면 검색에 걸린 하위가 숨어 왜 걸렸는지 알 수 없다
          groupDefaultExpanded={-1}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          localeText={AG_GRID_LOCALE}
          rowClassRules={rowClassRules}
          // 읽기 전용 목록이라 셀을 짚어 할 일이 없다 — 클릭한 칸에 초점 테두리가 남지 않게 한다
          suppressCellFocus
          getRowId={getRowId}
          // 페이지를 넘기면 맨 위부터 읽는다 — 스크롤이 남아 있으면 중간에 떨어진다
          onRowDataUpdated={({ api }) => api.ensureIndexVisible(0, 'top')}
        />
      </div>
    </AgGridProvider>
  )
}
