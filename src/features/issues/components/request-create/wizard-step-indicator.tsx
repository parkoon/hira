import { CheckIcon } from 'lucide-react'

import { cn } from '@/shared/utils/cn'

const STEPS = ['이슈 내용', '컴플라이언스 확인'] as const

/** 2단계 위저드 진행 표시 — 스펙 §4.1 */
export function WizardStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="text-muted-foreground mb-4 flex items-center gap-2 text-xs">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1
        const done = stepNumber < currentStep
        const current = stepNumber === currentStep

        return (
          <li
            key={label}
            className="flex items-center gap-2"
            aria-current={current ? 'step' : undefined}
          >
            {index > 0 && <span className="text-border">—</span>}
            <span
              className={cn(
                'flex items-center gap-1.5',
                current && 'text-foreground font-semibold'
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-[11px] font-bold',
                  done && 'bg-emerald-600 text-white',
                  current && 'bg-primary text-primary-foreground',
                  !done && !current && 'bg-muted text-muted-foreground'
                )}
              >
                {done ? <CheckIcon className="size-3" /> : stepNumber}
              </span>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
