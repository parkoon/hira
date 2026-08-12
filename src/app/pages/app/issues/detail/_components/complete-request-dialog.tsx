import { differenceInCalendarDays, parseISO } from 'date-fns'

import type { Request } from '@/features/issues/api/types'
import { getSubtaskProgress } from '@/features/issues/utils/issue-selectors'
import { Modal } from '@/shared/components/ui/modal'

type CompleteRequestDialogProps = {
  request: Request
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** 화면 7 — 최종 완료 확인 팝업 (스펙 §4.4) */
export function CompleteRequestDialog({
  request,
  open,
  onOpenChange,
  onConfirm,
}: CompleteRequestDialogProps) {
  const { total } = getSubtaskProgress(request)
  const remainingDays = differenceInCalendarDays(parseISO(request.dueDate), new Date())

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`${request.issueNo} 최종 완료`}
      // 안내 문구뿐이라 기본 고정 높이 대신 내용 높이를 따르게 한다
      className="h-auto max-h-[calc(100dvh-2rem)] sm:max-w-md"
      expandable={false}
      secondaryAction={{ label: '취소', onClick: () => onOpenChange(false) }}
      primaryAction={{
        label: '최종 완료',
        onClick: () => {
          onConfirm()
          onOpenChange(false)
        },
      }}
    >
      <div className="space-y-3 text-[13px] leading-relaxed">
        <p>
          하위작업 <strong>{total}건 모두 완료</strong>되었습니다.
          <br />
          완료요청일 {request.dueDate} 대비{' '}
          {remainingDays > 0 ? (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {remainingDays}일 조기 완료
            </span>
          ) : remainingDays === 0 ? (
            <span className="font-semibold">기한 내 완료</span>
          ) : (
            <span className="text-destructive font-semibold">{-remainingDays}일 지연</span>
          )}
        </p>

        <p className="rounded bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          최종 완료 후에는 하위작업을 추가하거나 상태를 되돌릴 수 없습니다. 추가 요건이 발생하면
          신규 이슈로 등록해 주세요.
        </p>
      </div>
    </Modal>
  )
}
