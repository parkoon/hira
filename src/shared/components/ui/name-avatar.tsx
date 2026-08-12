import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { cn } from '@/shared/utils/cn'

type NameAvatarProps = {
  name: string
  size?: React.ComponentProps<typeof Avatar>['size']
  className?: string
}

/** 이름의 첫 글자를 원형으로 표시하는 아바타. 프로필 이미지가 없는 사내 계정용. */
export function NameAvatar({ name, size = 'sm', className }: NameAvatarProps) {
  return (
    <Avatar
      size={size}
      className={cn('shrink-0', className)}
    >
      <AvatarFallback className="bg-muted text-muted-foreground font-medium">
        {name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  )
}
