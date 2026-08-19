import { useSuspenseQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useMemo } from 'react'

import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks'
import { PanelCard } from '@/features/tasks/components/panel-card'
import { Card } from '@/shared/components/ui/card'
import { Page } from '@/shared/components/ui/layout/page'
import { cn } from '@/shared/utils/cn'

import { StageDurationChart } from './_components/stage-duration-chart'
import { getStageDurations, getTaskSummary } from './_utils/report'

function StatTile({
  label,
  value,
  caption,
  alarming = false,
}: {
  label: string
  value: string
  caption?: string
  /** 문제 신호일 때만 붉게 — 라벨이 함께 있어 색만으로 말하지 않는다 */
  alarming?: boolean
}) {
  return (
    <Card
      size="sm"
      className="gap-0.5 px-4 py-3"
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn('text-2xl font-semibold tabular-nums', alarming && 'text-destructive')}>
        {value}
      </p>
      {caption && <p className="text-muted-foreground text-[11px]">{caption}</p>}
    </Card>
  )
}

/**
 * 리포트 — status_history가 이미 쌓아 둔 기록을 읽어서 보여준다 (리드 이상).
 * 기록하는 도구는 기록으로 보고할 수 있어야 완성이다.
 */
function ReportsPage() {
  const tasksQuery = useSuspenseQuery(getTasksQueryOptions())

  const today = format(new Date(), 'yyyy-MM-dd')
  const summary = useMemo(() => getTaskSummary(tasksQuery.data, today), [tasksQuery.data, today])
  const durations = useMemo(() => getStageDurations(tasksQuery.data), [tasksQuery.data])

  return (
    <Page>
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="진행중 작업"
            value={`${summary.inProgress}건`}
          />
          <StatTile
            label="완료 작업"
            value={`${summary.done}건`}
          />
          <StatTile
            label="지연 작업"
            value={`${summary.overdue}건`}
            caption="진행 중인데 목표일이 지남"
            alarming={summary.overdue > 0}
          />
          <StatTile
            label="평균 처리일"
            value={summary.avgLeadDays === null ? '—' : `${summary.avgLeadDays}일`}
            caption={
              summary.leadSamples > 0
                ? `승인 요청 → 최종 완료 · 완료 ${summary.leadSamples}건 기준`
                : '잴 수 있는 완료 건이 아직 없음'
            }
          />
        </div>

        <PanelCard title="단계별 평균 체류">
          <p className="text-muted-foreground mb-3 text-[11px]">
            하위작업이 각 단계에 머문 평균 시간 — 상태 전이 이력으로 잰다. 지금 진행 중인 구간은
            넣지 않는다.
          </p>
          <StageDurationChart durations={durations} />
        </PanelCard>
      </div>
    </Page>
  )
}

export { ReportsPage as Component }
