import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/utils/cn'

type ActionButtonProps = {
  label: string
  /** 있으면 버튼을 막고 이유를 툴팁으로 보여준다 */
  reason?: string | null
  /** 전이 진행 중 — 재클릭하면 이력·감사 로그가 중복으로 쌓인다 */
  pending?: boolean
  variant?: 'default' | 'outline' | 'destructive'
  /** 팝오버 안처럼 폭을 꽉 채워야 할 때 */
  fullWidth?: boolean
  onClick: () => void
}

/** 사유 툴팁이 필요한 disabled 버튼 패턴 — disabled 버튼은 이벤트를 안 뿜어 span으로 감싼다 */
export function ActionButton({
  label,
  reason,
  pending = false,
  variant = 'outline',
  fullWidth = false,
  onClick,
}: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-block', fullWidth && 'w-full')}>
          <Button
            variant={variant}
            className={cn(fullWidth && 'w-full')}
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
