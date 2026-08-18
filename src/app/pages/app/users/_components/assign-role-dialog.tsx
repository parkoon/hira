import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { OrgNode, User, UserRole } from '@/features/users/api/types'
import { ASSIGNABLE_ROLES, USER_ROLE_META } from '@/features/users/constants/metadata'
import { ORG_TREE } from '@/features/users/data/org-tree'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { Modal } from '@/shared/components/ui/modal'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { cn } from '@/shared/utils/cn'
import { toEnumOptions } from '@/shared/utils/enum'

const roleOptions = toEnumOptions(USER_ROLE_META, ASSIGNABLE_ROLES)

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
  onAssign: (userIds: string[], role: UserRole) => void
}

/** 조직도에서 구성원을 골라 작업자/리드 역할을 부여한다 (스펙 §3.2) */
export function AssignRoleDialog({ open, onOpenChange, users, onAssign }: AssignRoleDialogProps) {
  const [keyword, setKeyword] = useState('')
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  // 조직도는 사번으로 구성원을 가리키므로 선택도 사번으로 다룬다
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [role, setRole] = useState<UserRole>('WORKER')

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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setKeyword('')
      setCollapsedIds(new Set())
      setSelectedIds(new Set())
      setRole('WORKER')
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
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (!next.delete(loginId)) next.add(loginId)
      return next
    })
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

                return (
                  <li key={loginId}>
                    <Label
                      className={cn(
                        'w-full justify-start gap-2 rounded px-1.5 py-1 font-normal',
                        assigned ? 'text-muted-foreground' : 'hover:bg-muted cursor-pointer'
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.has(loginId)}
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
      description="조직도에서 구성원을 고르고 역할을 지정합니다. 담당자 역할은 사내 계정 최초 로그인 시 자동 부여되어 따로 등록할 필요가 없습니다."
      className="h-auto max-h-[calc(100dvh-2rem)] sm:max-w-lg"
      expandable={false}
      secondaryAction={{ label: '취소', onClick: () => handleOpenChange(false) }}
      primaryAction={{
        label: '추가',
        disabled: selectedIds.size === 0,
        onClick: () => {
          const userIds = [...selectedIds]
            .map((loginId) => usersByLoginId.get(loginId)?.id)
            .filter((id): id is string => id !== undefined)
          onAssign(userIds, role)
          handleOpenChange(false)
        },
      }}
    >
      <div className="space-y-4">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="이름, 사번 검색"
          aria-label="구성원 검색"
        />

        <ul className="h-72 overflow-y-auto rounded-md border p-1.5">
          {nodes.length > 0 ? (
            renderNodes(nodes)
          ) : (
            <li className="text-muted-foreground py-6 text-center text-sm">
              검색 결과가 없습니다.
            </li>
          )}
        </ul>

        <div className="flex items-center gap-3">
          <span className="shrink-0 text-sm font-medium">역할</span>
          <RadioGroup
            value={role}
            onValueChange={(value) => setRole(value as UserRole)}
            className="flex gap-4"
          >
            {roleOptions.map((option) => (
              <Label
                key={option.value}
                className="font-normal"
              >
                <RadioGroupItem value={option.value} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>
          {/* Modal 푸터는 액션 2개만 받으므로 선택 수는 본문에 둔다 */}
          <span className="text-muted-foreground ml-auto shrink-0 text-sm">
            {selectedIds.size}명 선택
          </span>
        </div>
      </div>
    </Modal>
  )
}
