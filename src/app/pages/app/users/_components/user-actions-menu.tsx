import { MoreHorizontalIcon, UserMinusIcon, UserPenIcon } from 'lucide-react'

import type { User, UserRole } from '@/features/users/api/types'
import { USER_ROLE_META } from '@/features/users/constants/metadata'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useConfirm } from '@/shared/hooks/use-confirm'

type UserActionsMenuProps = {
  user: User
  onRoleChange: (user: User, role: UserRole) => void
  onRevoke: (user: User) => void
}

export function UserActionsMenu({ user, onRoleChange, onRevoke }: UserActionsMenuProps) {
  const confirm = useConfirm()

  const isAdmin = user.role === 'ADMIN'
  const nextRole: UserRole = user.role === 'LEAD' ? 'WORKER' : 'LEAD'

  const handleRevoke = async () => {
    const confirmed = await confirm.open({
      title: `${user.name} 역할 회수`,
      description:
        '역할을 회수하면 요청자로 돌아갑니다. 전체 작업 조회와 하위작업 권한이 사라지고 명부에서도 빠집니다.',
      confirm: { text: '역할 회수', variant: 'destructive' },
    })
    if (!confirmed) return

    onRevoke(user)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`${user.name} 작업 메뉴`}
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
      >
        {isAdmin ? (
          <p className="text-muted-foreground px-1.5 py-1 text-[11px] leading-snug">
            관리자 역할은 시스템 셋업에서 지정합니다. 이 화면에서는 변경·회수할 수 없습니다.
          </p>
        ) : (
          <>
            <DropdownMenuItem onSelect={() => onRoleChange(user, nextRole)}>
              <UserPenIcon />
              {USER_ROLE_META[nextRole].label}로 변경
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => void handleRevoke()}
            >
              <UserMinusIcon />
              역할 회수
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
