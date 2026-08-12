import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/utils/cn'
import type { EnumTone } from '@/shared/utils/enum'

/**
 * Jira 로젠지 스타일의 상태 배지.
 * shadcn Badge를 기반으로 tone별 색만 덧입힌다. 앱 테마(primary)와 무관한 상태 구분 전용 색.
 */
const TONE_CLASS: Record<EnumTone, string> = {
  neutral: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

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
