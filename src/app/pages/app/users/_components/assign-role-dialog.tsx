import { ChevronDownIcon, ChevronRightIcon, UsersIcon, XIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { OrgNode, User, UserRole } from '@/features/users/api/types'
import type { UserRoleAssignment } from '@/features/users/api/update-user-roles'
import { ASSIGNABLE_ROLES, USER_ROLE_META } from '@/features/users/constants/metadata'
import { ORG_TREE } from '@/features/users/data/org-tree'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { Modal } from '@/shared/components/ui/modal'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { cn } from '@/shared/utils/cn'
import { toEnumOptions } from '@/shared/utils/enum'

const roleOptions = toEnumOptions(USER_ROLE_META, ASSIGNABLE_ROLES)

/** 고를 때 물려주는 기본 역할 — 대부분 작업자로 들어온다 */
const DEFAULT_ROLE: UserRole = 'WORKER'

/** 검색어에 맞는 구성원만 남기고, 남은 구성원이 없는 조직은 통째로 걷어낸다. */
function filterNodes(nodes: OrgNode[], isMatch: (loginId: string) => boolean): OrgNode[] {
  return nodes
    .map((node) => ({
      ...node,
      children: node.children && filterNodes(node.children, isMatch),
      memberLoginIds: node.memberLoginIds?.filter(isMatch),
    }))
    .filter((node) => (node.children?.length ?? 0) > 0 || (node.memberLoginIds?.length ?? 0) > 0)
}

type AssignRoleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  users: User[]
  onAssign: (assignments: UserRoleAssignment[]) => void
}

/**
 * 조직도에서 구성원을 골라 역할을 부여한다 (스펙 §3.2).
 *
 * 왼쪽에서 고르면 오른쪽 패널에 쌓이고 역할은 거기서 한 명씩 정한다 —
 * 한 번에 여러 명을 넣으면서도 누구는 작업자, 누구는 리드로 나눠 줄 수 있다.
 */
export function AssignRoleDialog({ open, onOpenChange, users, onAssign }: AssignRoleDialogProps) {
  const [keyword, setKeyword] = useState('')
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  // 조직도는 사번으로 구성원을 가리키므로 선택도 사번을 키로 다룬다
  const [rolesByLoginId, setRolesByLoginId] = useState<Map<string, UserRole>>(new Map())

  const usersByLoginId = useMemo(() => new Map(users.map((user) => [user.loginId, user])), [users])

  const nodes = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (query.length === 0) return ORG_TREE

    return filterNodes(ORG_TREE, (loginId) => {
      const user = usersByLoginId.get(loginId)
      if (!user) return false
      return [user.name, user.loginId].some((field) => field.toLowerCase().includes(query))
    })
  }, [keyword, usersByLoginId])

  const selected = useMemo(
    () =>
      [...rolesByLoginId].flatMap(([loginId, role]) => {
        const user = usersByLoginId.get(loginId)
        return user ? [{ user, role }] : []
      }),
    [rolesByLoginId, usersByLoginId]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setKeyword('')
      setCollapsedIds(new Set())
      setRolesByLoginId(new Map())
    }
    onOpenChange(nextOpen)
  }

  const toggleNode = (nodeId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (!next.delete(nodeId)) next.add(nodeId)
      return next
    })
  }

  const toggleMember = (loginId: string) => {
    setRolesByLoginId((prev) => {
      const next = new Map(prev)
      if (!next.delete(loginId)) next.set(loginId, DEFAULT_ROLE)
      return next
    })
  }

  const setRoleOf = (loginId: string, role: UserRole) => {
    setRolesByLoginId((prev) => new Map(prev).set(loginId, role))
  }

  const renderNodes = (nodeList: OrgNode[]) =>
    nodeList.map((node) => {
      // 검색 중에는 결과가 바로 보이도록 접힘 상태를 무시한다
      const expanded = keyword.trim().length > 0 || !collapsedIds.has(node.id)

      return (
        <li key={node.id}>
          <button
            type="button"
            onClick={() => toggleNode(node.id)}
            className="hover:bg-muted flex w-full items-center gap-1 rounded px-1.5 py-1 text-left"
          >
            {expanded ? (
              <ChevronDownIcon className="size-3.5 shrink-0" />
            ) : (
              <ChevronRightIcon className="size-3.5 shrink-0" />
            )}
            <span className="text-sm font-medium">{node.name}</span>
          </button>

          {expanded && (
            <ul className="pl-4">
              {node.children && renderNodes(node.children)}
              {node.memberLoginIds?.map((loginId) => {
                const user = usersByLoginId.get(loginId)
                if (!user) return null

                const assigned = user.role !== 'REQUESTER'
                const meta = USER_ROLE_META[user.role]
                const picked = rolesByLoginId.has(loginId)

                return (
                  <li key={loginId}>
                    <Label
                      className={cn(
                        'w-full justify-start gap-2 rounded px-1.5 py-1 font-normal',
                        assigned ? 'text-muted-foreground' : 'hover:bg-muted cursor-pointer',
                        picked && 'bg-primary/10'
                      )}
                    >
                      <Checkbox
                        checked={picked}
                        disabled={assigned}
                        onCheckedChange={() => toggleMember(loginId)}
                      />
                      <NameAvatar name={user.name} />
                      <span className="text-sm">{user.name}</span>
                      <span className="text-muted-foreground text-xs">{user.loginId}</span>
                      {assigned && <Lozenge tone={meta.tone}>{meta.label}</Lozenge>}
                    </Label>
                  </li>
                )
              })}
            </ul>
          )}
        </li>
      )
    })

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="구성원 추가"
      className="sm:max-w-3xl"
      noBodyPadding
      aside={
        <div className="flex h-full flex-col gap-3">
          <div className="flex shrink-0 items-center justify-between">
            <span className="text-xs font-semibold">선택한 구성원</span>
            <span className="text-muted-foreground text-xs">{selected.length}명</span>
          </div>

          {selected.length === 0 ? (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <UsersIcon className="size-8 stroke-1" />
              <p className="text-xs">왼쪽 조직도에서 구성원을 고르세요.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {selected.map(({ user, role }) => (
                <li
                  key={user.loginId}
                  className="rounded-lg border p-2"
                >
                  <div className="flex items-center gap-1.5">
                    <NameAvatar name={user.name} />
                    <span className="truncate text-sm font-medium">{user.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">{user.loginId}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="ml-auto shrink-0"
                      aria-label={user.name + ' 선택 해제'}
                      onClick={() => toggleMember(user.loginId)}
                    >
                      <XIcon />
                    </Button>
                  </div>

                  <Select
                    value={role}
                    onValueChange={(value: UserRole) => setRoleOf(user.loginId, value)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="mt-2 w-full"
                      aria-label={user.name + ' 역할'}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          )}
        </div>
      }
      secondaryAction={{ label: '취소', onClick: () => handleOpenChange(false) }}
      primaryAction={{
        label: selected.length > 0 ? selected.length + '명 추가' : '추가',
        disabled: selected.length === 0,
        onClick: () => {
          onAssign(selected.map(({ user, role }) => ({ userId: user.id, role })))
          handleOpenChange(false)
        },
      }}
    >
      {/* 조직도가 길어도 검색창은 늘 손에 닿는 자리에 있어야 한다 */}
      <div className="bg-popover sticky top-0 z-10 border-b px-4 py-3">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="이름, 사번 검색"
          aria-label="구성원 검색"
        />
      </div>

      <ul className="px-2 py-2">
        {nodes.length > 0 ? (
          renderNodes(nodes)
        ) : (
          <li className="text-muted-foreground py-6 text-center text-sm">검색 결과가 없습니다.</li>
        )}
      </ul>
    </Modal>
  )
}
