import { useState } from 'react'

import type { Task } from '@/features/tasks/api/types'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/textarea'

type RejectReasonDialogProps = {
  task: Task | null
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
}

/** 반려 시 사유 입력은 필수 (스펙 §4.3) */
export function RejectReasonDialog({ task, onOpenChange, onConfirm }: RejectReasonDialogProps) {
  const [reason, setReason] = useState('')

  const handleOpenChange = (open: boolean) => {
    if (!open) setReason('')
    onOpenChange(open)
  }

  return (
    <Modal
      open={task !== null}
      onOpenChange={handleOpenChange}
      title={`${task?.taskNo ?? ''} 반려`}
      description="반려 사유는 담당자에게 그대로 전달되며 감사 로그에 기록됩니다."
      // 필드가 하나뿐이라 기본 고정 높이 대신 내용 높이를 따르게 한다
      className="h-auto max-h-[calc(100dvh-2rem)] sm:max-w-lg"
      expandable={false}
      secondaryAction={{ label: '취소', onClick: () => handleOpenChange(false) }}
      primaryAction={{
        label: '반려',
        variant: 'destructive',
        disabled: reason.trim().length === 0,
        onClick: () => {
          onConfirm(reason.trim())
          handleOpenChange(false)
        },
      }}
    >
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="반려 사유를 입력하세요 (필수)"
        className="min-h-24"
        aria-label="반려 사유"
      />
    </Modal>
  )
}
