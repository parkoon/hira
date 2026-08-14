import { Badge } from '@/shared/components/ui/badge'
import { TONE_CLASS } from '@/shared/components/ui/tone'
import { cn } from '@/shared/utils/cn'
import type { EnumTone } from '@/shared/utils/enum'

/**
 * Jira 로젠지 스타일의 상태 배지.
 * shadcn Badge를 기반으로 tone별 색만 덧입힌다. 색 팔레트는 `tone.ts`가 갖는다.
 */
type LozengeProps = React.ComponentProps<typeof Badge> & {
  tone?: EnumTone
}

export function Lozenge({ tone = 'neutral', className, ...props }: LozengeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'h-[18px] rounded-sm px-1.5 text-[11px] font-bold',
        TONE_CLASS[tone],
        className
      )}
      {...props}
    />
  )
}
