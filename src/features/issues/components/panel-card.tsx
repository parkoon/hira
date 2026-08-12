import { ChevronDownIcon } from 'lucide-react'

import { Card } from '@/shared/components/ui/card'
import { useDisclosure } from '@/shared/hooks/use-disclosure'
import { cn } from '@/shared/utils/cn'

type PanelCardProps = {
  title: string
  /** 접혔을 때 제목 옆에 보여줄 요약 — Jira 'More fields'의 필드 나열 자리 */
  summary?: string
  children: React.ReactNode
}

/** 우측 패널의 접을 수 있는 카드 — Jira 이슈 뷰의 Details 패널 모양 */
export function PanelCard({ title, summary, children }: PanelCardProps) {
  const card = useDisclosure(true)

  return (
    <Card
      size="sm"
      className="gap-0 py-0"
    >
      <button
        type="button"
        aria-expanded={card.isOpen}
        className="hover:bg-muted/50 flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors"
        onClick={card.toggle}
      >
        <span className="text-sm font-semibold">{title}</span>
        {!card.isOpen && summary && (
          <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">{summary}</span>
        )}
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground ml-auto size-4 shrink-0 transition-transform',
            card.isOpen && 'rotate-180'
          )}
        />
      </button>

      {card.isOpen && <div className="border-t px-3 py-3">{children}</div>}
    </Card>
  )
}

/** 카드 안의 필드 행 — Jira처럼 라벨 왼쪽·값 오른쪽 2컬럼 */
export function PanelCardField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-x-2 py-1.5 first:pt-0 last:pb-0',
        className
      )}
    >
      <p className="text-muted-foreground text-[13px] font-medium">{label}</p>
      <div className="min-w-0 text-[13px]">{children}</div>
    </div>
  )
}
