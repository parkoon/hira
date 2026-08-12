import { InboxIcon } from 'lucide-react'

import { cn } from '@/shared/utils/cn'

type EmptyProps = {
  icon?: React.ReactNode
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function Empty({
  icon = <InboxIcon className="size-10 stroke-1" />,
  title,
  description,
  children,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-4 rounded-xl border py-16 text-center',
        className
      )}
    >
      <div className="text-muted-foreground">{icon}</div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
      {children}
    </div>
  )
}
