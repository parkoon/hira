import type { ReactNode } from 'react'

import { Card } from '@/shared/components/ui/card'
import { cn } from '@/shared/utils/cn'

type PanelCardProps = {
  title: string
  /** 제목 줄 오른쪽 — 이 카드가 담은 것에 대한 주 동작 하나 */
  action?: ReactNode
  children: ReactNode
}

/** 우측 패널의 카드 — Jira 이슈 뷰의 Details 패널 모양 */
export function PanelCard({ title, action, children }: PanelCardProps) {
  return (
    <Card
      size="sm"
      className="gap-0 py-0"
    >
      <div className="flex min-h-11 items-center gap-2 px-3 py-1.5">
        <span className="text-sm font-semibold">{title}</span>
        {/* 액션은 카드 최상단에 고정된다 — 내용이 길어져도 주 동작이 아래로 밀리지 않는다 */}
        {action && <div className="ml-auto">{action}</div>}
      </div>

      <div className="border-t px-3 py-3">{children}</div>
    </Card>
  )
}

/**
 * 카드 안의 필드 행 — Jira처럼 라벨 왼쪽·값 오른쪽 2컬럼.
 * 라벨 폭은 행마다 재지 않고 고정한다 — 재면 행끼리 값 시작점이 어긋난다.
 * 6rem은 가장 긴 라벨('배포 완료 URL')이 한 줄에 들어가는 선이다.
 */
export function PanelCardField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-2 py-1.5 first:pt-0 last:pb-0',
        className
      )}
    >
      <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
      <div className="min-w-0 text-[13px]">{children}</div>
    </div>
  )
}
