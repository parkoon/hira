import { LogOutIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useSignOutMutation } from '@/features/users/api/sign-out'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { paths } from '@/shared/config/paths'

export function NavUserButton() {
  const { user } = useCurrentUser()
  const signOut = useSignOutMutation()
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="사용자 메뉴"
        >
          <NameAvatar
            name={user.name}
            size="default"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <NameAvatar
              name={user.name}
              size="default"
            />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">
                {user.dept} · {user.loginId}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            signOut.mutate(
              { actorName: user.name },
              { onSuccess: () => void navigate(paths.login.getHref()) }
            )
          }
        >
          <LogOutIcon />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
