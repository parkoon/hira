import { useState } from 'react'
import { toast } from 'sonner'

import { useRecordTaskEvidenceMutation } from '@/features/tasks/api/record-task-evidence'
import type { Task } from '@/features/tasks/api/types'
import { EvidenceContentView } from '@/features/tasks/components/evidence-content-view'
import { TransitionEvidenceDialog } from '@/features/tasks/components/transition-evidence-dialog'
import { getTaskStepEvidence } from '@/features/tasks/utils/task-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { Lozenge } from '@/shared/components/ui/lozenge'

/** 인수 확인 기록. 전이 후에는 여기서 확인하고 정정한다 (시나리오 15) */
export function TaskAcceptanceCard({
  task,
  canEdit,
}: {
  task: Task
  /** 정정은 등록자 본인만 */
  canEdit: boolean
}) {
  const [editOpen, setEditOpen] = useState(false)
  const { user } = useCurrentUser()
  const recordTaskEvidence = useRecordTaskEvidenceMutation()

  const { latest, revisions } = getTaskStepEvidence(task, 'ACCEPTANCE')
  if (!latest) return null

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">인수 확인</h2>

      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          {revisions > 0 && <Lozenge tone="warning">{revisions}회 정정</Lozenge>}
          <EvidenceContentView evidence={latest} />
          <p className="text-muted-foreground text-[11px]">
            {latest.recordedBy} · {latest.recordedAt}
          </p>
        </div>

        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            수정
          </Button>
        )}
      </div>

      {editOpen && (
        <TransitionEvidenceDialog
          open
          title="인수 확인 증적 정정"
          hint="이전 값은 지우지 않고 정정 이력으로 남습니다."
          confirmLabel="정정"
          initialValues={latest}
          onOpenChange={(open) => !open && setEditOpen(false)}
          onConfirm={(evidence) => {
            recordTaskEvidence.mutate(
              {
                taskNo: task.taskNo,
                status: 'ACCEPTANCE',
                evidence,
                actorName: user.name,
              },
              { onSuccess: () => toast.success('인수 확인 증적을 정정했습니다.') }
            )
          }}
        />
      )}
    </section>
  )
}
