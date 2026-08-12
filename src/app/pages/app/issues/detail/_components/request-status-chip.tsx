import type { RequestStatus } from '@/features/issues/api/types'
import { REQUEST_STATUS_META } from '@/features/issues/constants/metadata'
import { Lozenge } from '@/shared/components/ui/lozenge'

/**
 * 표시 전용 상태 칩 — 전이는 옆의 액션 버튼이 맡는다.
 * 게이트·증적·역할이 걸린 고정 워크플로라 자유 전이 메뉴를 두지 않는다.
 * 로젠지를 옆 버튼과 같은 높이로 키운 것이라 tone 색은 로젠지 것을 그대로 쓴다.
 */
export function RequestStatusChip({ status }: { status: RequestStatus }) {
  const meta = REQUEST_STATUS_META[status]

  return (
    <Lozenge
      tone={meta.tone}
      className="h-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-semibold"
    >
      {meta.label}
    </Lozenge>
  )
}
