import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useRecordEvidenceMutation } from '@/features/tasks/api/record-evidence'
import type { Subtask, SubtaskStatus, Task } from '@/features/tasks/api/types'
import { EvidenceContentView } from '@/features/tasks/components/evidence-content-view'
import { TransitionEvidenceDialog } from '@/features/tasks/components/transition-evidence-dialog'
import { SUBTASK_ADVANCE_LABEL } from '@/features/tasks/constants/metadata'
import {
  canActOnSubtaskStep,
  getEvidenceSteps,
  getStepEvidence,
} from '@/features/tasks/utils/task-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { cn } from '@/shared/utils/cn'

type TransitionEvidenceCardProps = {
  /** 정정 주체 판정에 부모가 필요하다 — 인수 증적은 등록자만 고친다 */
  task: Task
  subtask: Subtask
}

/**
 * 단계별로 남긴 증적. 전이 후에는 여기서 확인하고 정정한다 (시나리오 각주 3).
 * 정정은 그 단계의 전이 주체와 같은 권한이라 단계마다 따로 판정한다.
 * 지나온 단계의 기록이라 왼쪽 레일로 잇는다 — 도트 열 너비는 활동 섹션의 아바타와 맞춘다.
 */
export function TransitionEvidenceCard({ task, subtask }: TransitionEvidenceCardProps) {
  const [editTarget, setEditTarget] = useState<SubtaskStatus | null>(null)
  const { user } = useCurrentUser()
  const recordEvidence = useRecordEvidenceMutation()

  const steps = getEvidenceSteps(subtask)

  const stepLabel = (status: SubtaskStatus) => SUBTASK_ADVANCE_LABEL[status] ?? status

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">단계별 증적</h2>

      {steps.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-[13px]">
          아직 남긴 증적이 없습니다.
        </p>
      ) : (
        <ol>
          {steps.map((status, index) => {
            const { latest, revisions } = getStepEvidence(subtask, status)
            if (!latest) return null

            const last = index === steps.length - 1
            const canEdit = canActOnSubtaskStep(task, subtask, user, status)

            return (
              <li
                key={status}
                className="group/step flex gap-2.5"
              >
                <div className="flex w-6 shrink-0 flex-col items-center">
                  {/* 증적이 있다는 건 그 단계를 끝냈다는 뜻이라 스테퍼의 완료 색을 쓴다 */}
                  <span
                    aria-hidden
                    className="mt-1.5 size-2.5 shrink-0 rounded-full bg-emerald-600 ring-3 ring-emerald-600/15"
                  />
                  {!last && (
                    <span
                      aria-hidden
                      className="bg-border mt-1 w-0.5 flex-1"
                    />
                  )}
                </div>

                <div className={cn('min-w-0 flex-1 space-y-0.5', !last && 'pb-4')}>
                  <div className="flex items-start gap-2.5">
                    <p className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-[13px] font-medium">
                      {stepLabel(status)}
                      {revisions > 0 && <Lozenge tone="warning">{revisions}회 정정</Lozenge>}
                    </p>

                    {canEdit && (
                      // 단계마다 하나씩 붙어 목록이 번잡해진다 — 짚은 항목에서만 드러낸다.
                      // 자리는 늘 차지해 호버할 때 제목이 밀리지 않고, 키보드로도 닿는다
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${stepLabel(status)} 증적 정정`}
                        className="opacity-0 transition-opacity group-hover/step:opacity-100 focus-visible:opacity-100"
                        onClick={() => setEditTarget(status)}
                      >
                        <PencilIcon />
                      </Button>
                    )}
                  </div>

                  <EvidenceContentView evidence={latest} />
                  <p className="text-muted-foreground text-[11px]">
                    {latest.recordedBy} · {latest.recordedAt}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {/* 대상이 바뀌면 리마운트해 입력값을 초기화한다 */}
      {editTarget && (
        <TransitionEvidenceDialog
          key={editTarget}
          open
          title={`${stepLabel(editTarget)} 증적 정정`}
          hint="이전 값은 지우지 않고 정정 이력으로 남습니다."
          confirmLabel="정정"
          initialValues={getStepEvidence(subtask, editTarget).latest ?? undefined}
          onOpenChange={(open) => !open && setEditTarget(null)}
          onConfirm={(evidence) => {
            recordEvidence.mutate(
              {
                subtaskNo: subtask.subtaskNo,
                status: editTarget,
                evidence,
                actorName: user.name,
              },
              { onSuccess: () => toast.success(`${stepLabel(editTarget)} 증적을 정정했습니다.`) }
            )
          }}
        />
      )}
    </section>
  )
}
