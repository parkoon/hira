import { ChevronDownIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { cn } from '@/shared/utils/cn'

type StatusWorkflowPopoverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 현재 상태 — 트리거가 곧 상태다 */
  label: string
  /** 흐름 순서대로의 단계 라벨 — 상태 enum은 화면마다 달라 라벨만 받는다 */
  steps: string[]
  /** 현재 단계 인덱스. 흐름 밖 상태(반려 등)면 -1 */
  currentIndex: number
  /** 흐름을 벗어난 현재 상태 안내 — 반려처럼 선형 경로에 없는 경우 (선택) */
  note?: string
  /**
   * 현재 단계에서 앞으로 나아가는 액션 하나. "여기까지 왔고 다음은 저기"를 한 번에 읽히게 한다.
   * 회수·반려처럼 흐름을 벗어나는 경로는 여기 넣지 않는다 — 되돌리기 어려운 액션이 숨으면 안 된다.
   */
  action?: ReactNode
}

/**
 * 상태 버튼을 눌러 여는 워크플로 팝오버 — 점과 선으로 잇는 세로 레일.
 *
 * 트리거는 배지가 아니라 텍스트다. 배지도, 배지의 색도 목록에서 여러 행을 훑기 위한 장치인데
 * 상세에는 상태가 하나뿐이고 바로 옆에 '상태' 라벨이 붙어 있어 훑을 일도 알려줄 일도 없다.
 * 같은 열의 다른 값들이 전부 평범한 텍스트라 여기만 색 블록이면 시선을 과하게 가져간다.
 *
 * 단계 번호는 두지 않는다. 고정 워크플로라 "몇 단계"로 부를 일이 없고, 번호가 빠지면
 * 점이 작아져 라벨이 주인공이 된다. 세로로 두는 이유는 단계가 늘어도 선형이 유지되기 때문이다 —
 * 가로는 하위작업 9단계에서 줄이 접히며 흐름이 한 번 끊긴다.
 *
 * 지나온 단계는 채운 점, 현재는 테를 두른 점, 남은 단계는 빈 점 — 색 말고 모양으로도 구분된다.
 */
export function StatusWorkflowPopover({
  open,
  onOpenChange,
  label,
  steps,
  currentIndex,
  note,
  action,
}: StatusWorkflowPopoverProps) {
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger asChild>
        {/* -ml-2로 안쪽 여백만큼 되밀어, 라벨 글자가 아래 필드 값들과 같은 세로선에서 시작한다 */}
        <button
          type="button"
          className="hover:bg-muted focus-visible:ring-ring/50 data-[state=open]:bg-muted -ml-2 flex h-7 items-center gap-1 rounded-md px-2 text-[13px] font-medium transition-colors outline-none focus-visible:ring-3"
        >
          {label}
          <ChevronDownIcon
            aria-hidden
            className={cn(
              'text-muted-foreground size-3.5 transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        // 내용 폭을 따르되(단계 라벨 길이가 화면마다 다르다) 너무 좁아지지 않게 바닥을 둔다
        className="w-auto max-w-[calc(100vw-2rem)] min-w-60 p-3"
      >
        <ol>
          {steps.map((label, index) => {
            const done = currentIndex >= 0 && index < currentIndex
            const current = index === currentIndex
            const first = index === 0
            const last = index === steps.length - 1

            return (
              <li
                key={label}
                aria-current={current ? 'step' : undefined}
                className="flex gap-2.5"
              >
                {/*
                  선을 점 위·아래로 나눠 그린다. 점을 상자 안에서 가운데 정렬하면 그 위쪽 여백만큼
                  레일이 끊기므로, 위 칸(h-1.5)이 그 여백을 메워 앞 행에서 내려온 선과 이어진다.
                  점 중심이 라벨 첫 줄(leading-5.5) 중앙에 오도록 6px + 5px = 11px에 놓인다.
                */}
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={cn(
                      'h-1.5 w-0.5',
                      first && 'invisible',
                      done || current ? 'bg-emerald-600' : 'bg-border'
                    )}
                  />
                  <span
                    className={cn(
                      'size-2.5 shrink-0 rounded-full',
                      done && 'bg-emerald-600',
                      current && 'bg-primary ring-primary/25 ring-3',
                      !done && !current && 'border-muted-foreground/40 border-2'
                    )}
                  />
                  {!last && (
                    <span
                      aria-hidden
                      className={cn('w-0.5 flex-1', done ? 'bg-emerald-600' : 'bg-border')}
                    />
                  )}
                </div>

                <span
                  className={cn(
                    'text-[13px] leading-5.5 whitespace-nowrap',
                    !last && 'pb-3',
                    current ? 'text-foreground font-bold' : 'text-muted-foreground'
                  )}
                >
                  {label}
                  {/* 색·굵기 말고도 상태가 읽히도록 — 스크린리더 전용 */}
                  {done && <span className="sr-only"> (완료)</span>}
                  {current && <span className="sr-only"> (현재 단계)</span>}
                </span>
              </li>
            )
          })}
        </ol>

        {note && <p className="text-muted-foreground text-xs">{note}</p>}

        {action && <div className="border-t pt-2.5">{action}</div>}
      </PopoverContent>
    </Popover>
  )
}
