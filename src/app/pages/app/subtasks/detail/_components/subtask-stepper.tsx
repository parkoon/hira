import { CheckIcon } from 'lucide-react'

import type { Subtask } from '@/features/issues/api/types'
import { SUBTASK_STATUS_META } from '@/features/issues/constants/metadata'
import { getSubtaskFlow } from '@/features/issues/constants/transitions'
import { cn } from '@/shared/utils/cn'

/**
 * 세로 상태 스테퍼 — 우측 패널 '진행 단계' 카드 안에 들어간다.
 * 배포형 8단계(DBA 검증 시 9단계) / 비배포형 4단계. DBA 단계는 개발 완료에서 체크해야 생긴다 (시나리오 8).
 */
export function SubtaskStepper({ subtask }: { subtask: Subtask }) {
  const steps = getSubtaskFlow(subtask)
  const currentIndex = steps.indexOf(subtask.status)

  return (
    <ol>
      {steps.map((step, index) => {
        const done = index < currentIndex
        const current = index === currentIndex
        const last = index === steps.length - 1

        return (
          <li
            key={step}
            className="flex gap-2.5"
            aria-current={current ? 'step' : undefined}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-5.5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  done && 'bg-emerald-600 text-white',
                  current && 'bg-primary text-primary-foreground ring-primary/20 ring-3',
                  !done && !current && 'bg-muted text-muted-foreground'
                )}
              >
                {done ? <CheckIcon className="size-3" /> : index + 1}
              </span>
              {!last && (
                <span
                  aria-hidden
                  className={cn('w-0.5 flex-1', done ? 'bg-emerald-600' : 'bg-border')}
                />
              )}
            </div>
            <span
              className={cn(
                'text-[13px] leading-5.5',
                !last && 'pb-3.5',
                current ? 'text-foreground font-bold' : 'text-muted-foreground'
              )}
            >
              {SUBTASK_STATUS_META[step].label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
