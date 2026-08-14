import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/utils/cn'

type ActionButtonProps = {
  label: string
  /** 있으면 막고 이유를 툴팁으로 보여준다 — 막힌 버튼은 이유 없이 회색으로 두지 않는다 */
  reason?: string | null
  /** 전이 진행 중 — 재클릭하면 이력·감사 로그가 중복으로 쌓인다 */
  pending?: boolean
  variant?: 'default' | 'outline' | 'destructive' | 'link'
  size?: 'default' | 'sm'
  className?: string
  onClick: () => void
}

/** 사유 툴팁이 필요한 disabled 버튼 패턴 — disabled 버튼은 이벤트를 안 뿜어 span으로 감싼다 */
export function ActionButton({
  label,
  reason,
  pending = false,
  variant = 'outline',
  size = 'default',
  className,
  onClick,
}: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block">
          <Button
            variant={variant}
            size={size}
            className={cn(className)}
            disabled={Boolean(reason) || pending}
            onClick={onClick}
          >
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      {reason && <TooltipContent>{reason}</TooltipContent>}
    </Tooltip>
  )
}
