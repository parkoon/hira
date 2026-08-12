import { useSuspenseQuery } from '@tanstack/react-query'
import { CheckIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { IssueActor } from '@/features/issues/api/types'
import { getUsersQueryOptions } from '@/features/users/api/get-users'
import { selectAssignableUsers } from '@/features/users/utils/user-selectors'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { NameAvatar } from '@/shared/components/ui/name-avatar'

type AssigneeMenuProps = {
  assignee: IssueActor
  onChange: (assignee: IssueActor) => void
}

/** 담당자 아바타를 눌러 바로 바꾸는 Jira 방식의 배정 메뉴 (스펙 §5.1) */
export function AssigneeMenu({ assignee, onChange }: AssigneeMenuProps) {
  const usersQuery = useSuspenseQuery(getUsersQueryOptions())
  const assignableUsers = selectAssignableUsers(usersQuery.data)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="link"
          size="xs"
          className="text-blue-700 dark:text-blue-400"
        >
          변경
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60"
      >
        <DropdownMenuLabel>담당자 변경</DropdownMenuLabel>
        {assignableUsers.map((user) => {
          const current = user.name === assignee.name
          return (
            <DropdownMenuItem
              key={user.loginId}
              onSelect={() => {
                if (current) return
                onChange({ name: user.name, dept: user.dept })
                toast.success(`담당자를 ${user.name}(으)로 변경했습니다.`)
              }}
            >
              <NameAvatar name={user.name} />
              <span className="flex-1 truncate">
                {user.name} · {user.dept}
              </span>
              {current && <CheckIcon className="size-3.5 shrink-0" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
