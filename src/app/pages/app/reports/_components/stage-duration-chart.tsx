import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import type { StageDuration } from '../_utils/report'

/**
 * 단계별 평균 체류 — 단일 계열 가로 막대.
 * 값은 막대 끝에 텍스트 토큰으로 직접 적는다 — 색은 크기만 말하고 숫자는 글자가 말한다.
 * 막대는 왼쪽(기준선)이 각지고 데이터 끝만 둥글다.
 */
export function StageDurationChart({ durations }: { durations: StageDuration[] }) {
  if (durations.length === 0) {
    return (
      <p className="text-muted-foreground text-[13px]">
        아직 잴 수 있는 단계 체류 기록이 없습니다. 하위작업이 단계를 지나면 쌓입니다.
      </p>
    )
  }

  const maxDays = Math.max(...durations.map((duration) => duration.avgDays))

  return (
    <div className="space-y-2">
      {durations.map((duration) => (
        <Tooltip key={duration.status}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2.5">
              <span className="text-muted-foreground w-24 shrink-0 text-[13px]">
                {duration.label}
              </span>
              <div className="bg-muted h-2.5 min-w-0 flex-1 overflow-hidden rounded-r-[4px]">
                <div
                  className="h-full rounded-r-[4px] bg-blue-600 dark:bg-blue-500"
                  // 0일짜리 단계도 존재는 보여야 한다 — 최소 폭을 깔아준다
                  style={{ width: `${Math.max((duration.avgDays / maxDays) * 100, 2)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-[13px] tabular-nums">
                {duration.avgDays}일
                <span className="text-muted-foreground ml-1 text-[11px]">
                  · {duration.samples}건
                </span>
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {duration.label}에 평균 {duration.avgDays}일 머묾 (완료 구간 {duration.samples}건 기준)
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
