import type { SubtaskStatus } from '@/features/issues/api/types'
import { SUBTASK_STATUS_META } from '@/features/issues/constants/metadata'
import { Lozenge } from '@/shared/components/ui/lozenge'

/**
 * 표시 전용 상태 칩 — 전이는 옆의 전진 버튼이 맡는다.
 * 패널이 자체 스크롤이라 아래 '진행 단계' 카드가 밀려도 현재 상태는 맨 위에 남는다.
 * 로젠지를 옆 버튼과 같은 높이로 키운 것이라 tone 색은 로젠지 것을 그대로 쓴다.
 */
export function SubtaskStatusChip({ status }: { status: SubtaskStatus }) {
  const meta = SUBTASK_STATUS_META[status]

  return (
    <Lozenge
      tone={meta.tone}
      className="h-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-semibold"
    >
      {meta.label}
    </Lozenge>
  )
}
