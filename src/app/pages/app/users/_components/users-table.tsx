import type { ColDef } from 'ag-grid-community'
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'

import type { User, UserRole } from '@/features/users/api/types'
import { USER_ROLE_META } from '@/features/users/constants/metadata'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import {
  AG_GRID_DEFAULT_COL_DEF,
  AG_GRID_LOCALE,
  AG_GRID_MODULES,
  agGridTheme,
} from '@/shared/lib/ag-grid'

import { UserActionsMenu } from './user-actions-menu'

type UsersTableProps = {
  users: User[]
  onRoleChange: (user: User, role: UserRole) => void
  onRevoke: (user: User) => void
}

export function UsersTable({ users, onRoleChange, onRevoke }: UsersTableProps) {
  const columnDefs = useMemo<ColDef<User>[]>(
    () => [
      { field: 'loginId', headerName: '사번', width: 110 },
      {
        field: 'name',
        headerName: '이름',
        width: 140,
        cellRenderer: ({ data }: { data: User }) => (
          <span className="flex items-center gap-1.5">
            <NameAvatar name={data.name} />
            {data.name}
          </span>
        ),
      },
      {
        field: 'dept',
        headerName: '부서',
        flex: 1,
        minWidth: 180,
        cellRenderer: ({ data }: { data: User }) => (
          <span className="flex items-center gap-1.5">
            {data.dept}
            {data.external && <Lozenge tone="info">타팀 협업</Lozenge>}
          </span>
        ),
      },
      {
        field: 'role',
        headerName: '역할',
        width: 110,
        cellRenderer: ({ data }: { data: User }) => (
          <span className="flex h-full items-center">
            <Lozenge tone={USER_ROLE_META[data.role].tone}>
              {USER_ROLE_META[data.role].label}
            </Lozenge>
          </span>
        ),
      },
      {
        headerName: '최근 변경',
        flex: 1,
        minWidth: 180,
        valueGetter: ({ data }) =>
          data?.roleChangedAt ? `${data.roleChangedAt} · ${data.roleChangedBy}` : '— (기본 역할)',
      },
      {
        headerName: '',
        width: 56,
        sortable: false,
        resizable: false,
        cellRenderer: ({ data }: { data: User }) => (
          <span className="flex h-full items-center">
            <UserActionsMenu
              user={data}
              onRoleChange={onRoleChange}
              onRevoke={onRevoke}
            />
          </span>
        ),
      },
    ],
    [onRoleChange, onRevoke]
  )

  return (
    <AgGridProvider modules={AG_GRID_MODULES}>
      <div className="min-h-0 w-full flex-1 border-t">
        <AgGridReact<User>
          theme={agGridTheme}
          rowData={users}
          columnDefs={columnDefs}
          defaultColDef={AG_GRID_DEFAULT_COL_DEF}
          localeText={AG_GRID_LOCALE}
        />
      </div>
    </AgGridProvider>
  )
}
