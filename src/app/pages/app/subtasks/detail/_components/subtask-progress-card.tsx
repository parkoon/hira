import { useState } from 'react'
import { toast } from 'sonner'

import { useTransitionSubtaskMutation } from '@/features/issues/api/transition-subtask'
import type { Request, Subtask } from '@/features/issues/api/types'
import { ActionButton } from '@/features/issues/components/action-button'
import { PanelCard } from '@/features/issues/components/panel-card'
import { TransitionEvidenceDialog } from '@/features/issues/components/transition-evidence-dialog'
import { WorkflowSteps } from '@/features/issues/components/workflow-steps'
import { SUBTASK_ADVANCE_LABEL, SUBTASK_STATUS_META } from '@/features/issues/constants/metadata'
import { EVIDENCE_HINT } from '@/features/issues/constants/transition-evidence'
import {
  getNextSubtaskStatus,
  getPostDevelopmentStatus,
  getSubtaskFlow,
} from '@/features/issues/constants/transitions'
import { getSubtaskDeployGate } from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Field, FieldLabel } from '@/shared/components/ui/field'
import { Textarea } from '@/shared/components/ui/textarea'
import { useConfirm } from '@/shared/hooks/use-confirm'

type SubtaskProgressCardProps = {
  subtask: Subtask
  /** 이행 게이트 판정에 부모 상태가 필요하다 (시나리오 17) */
  request: Request
  /** 전이는 담당자·리드만 가능 (스펙 §5.3) */
  canTransition: boolean
}

/**
 * 상태에 관한 전부 — 지금 어디까지 왔는지(레일)와 다음 단계로 미는 액션을 한 카드에 둔다.
 * 하위작업은 흐름을 벗어나는 경로가 없어 제목 줄의 액션 하나가 전부다.
 */
export function SubtaskProgressCard({ subtask, request, canTransition }: SubtaskProgressCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [dbaChecked, setDbaChecked] = useState(false)
  const [dbaRequest, setDbaRequest] = useState('')
  const { user } = useCurrentUser()
  const confirm = useConfirm()
  const transitionSubtask = useTransitionSubtaskMutation()

  const flow = getSubtaskFlow(subtask)
  // DBA 검증중은 결재가 떨어지면 자동으로 넘어가고, 완료는 더 갈 곳이 없다
  const label = SUBTASK_ADVANCE_LABEL[subtask.status]
  // 이행은 부모 인수 확인이 끝나야 가능하다 (시나리오 17)
  const deployGate = getSubtaskDeployGate(request, subtask)
  const hint = EVIDENCE_HINT[subtask.status]

  const isDevelopmentStep = subtask.status === 'DEVELOPMENT'
  // 개발 완료만 다음 단계가 체크 여부로 갈린다 (시나리오 8)
  const nextStatus = isDevelopmentStep
    ? getPostDevelopmentStatus(dbaChecked ? dbaRequest : null)
    : getNextSubtaskStatus(subtask)

  const handleForward = () => {
    if (hint) {
      setEvidenceOpen(true)
      return
    }
    if (!nextStatus) return

    void confirm
      .open({
        title: label,
        description: `${subtask.issueNo} 하위작업이 ${SUBTASK_STATUS_META[nextStatus].label}(으)로 바뀝니다.`,
        confirm: { text: label },
      })
      .then((ok) => {
        if (!ok) return
        transitionSubtask.mutate(
          { subtaskNo: subtask.issueNo, toStatus: nextStatus, actorName: user.name },
          {
            onSuccess: () =>
              toast.success(`${SUBTASK_STATUS_META[nextStatus].label}(으)로 전이했습니다.`),
          }
        )
      })
  }

  return (
    <>
      <PanelCard
        title="진행 상태"
        action={
          // 전이 권한이 없으면 아예 렌더하지 않는다 — 그 사람에게 존재하지 않는 액션이다
          label &&
          canTransition && (
            <ActionButton
              label={label}
              reason={deployGate.reason}
              pending={transitionSubtask.isPending}
              variant="default"
              onClick={handleForward}
            />
          )
        }
      >
        <WorkflowSteps
          steps={flow.map((status) => SUBTASK_STATUS_META[status].label)}
          currentIndex={flow.indexOf(subtask.status)}
        />
      </PanelCard>

      {/* 열릴 때만 마운트한다 — 취소 후 다시 열면 빈 입력으로 시작해야 한다 */}
      {evidenceOpen && (
        <TransitionEvidenceDialog
          open
          title={label ?? ''}
          hint={hint ?? ''}
          outcome={nextStatus ? SUBTASK_STATUS_META[nextStatus].label : undefined}
          confirmLabel={label ?? ''}
          confirmDisabled={
            (isDevelopmentStep && dbaChecked && dbaRequest.trim().length === 0) ||
            transitionSubtask.isPending
          }
          onOpenChange={(next) => {
            setEvidenceOpen(next)
            // 팝업은 언마운트로 리셋되지만 DBA 입력은 밖에 있어 직접 비운다
            if (!next) {
              setDbaChecked(false)
              setDbaRequest('')
            }
          }}
          onConfirm={(evidence) => {
            if (!nextStatus) return
            transitionSubtask.mutate(
              {
                subtaskNo: subtask.issueNo,
                toStatus: nextStatus,
                actorName: user.name,
                evidence,
                ...(isDevelopmentStep && {
                  dbaVerificationRequest: dbaChecked ? dbaRequest : null,
                }),
              },
              {
                onSuccess: () =>
                  toast.success(`${SUBTASK_STATUS_META[nextStatus].label}(으)로 전이했습니다.`),
              }
            )
          }}
        >
          {isDevelopmentStep && (
            <div className="bg-muted space-y-3 rounded-md px-3 py-2.5">
              <label className="flex items-start gap-2 text-[13px]">
                <Checkbox
                  checked={dbaChecked}
                  onCheckedChange={(checked) => setDbaChecked(checked === true)}
                />
                <span>
                  DBA 검증을 받습니다
                  <span className="text-muted-foreground block text-xs">
                    체크하면 제3자검증 전에 DBA 검증중 단계를 거칩니다.
                  </span>
                </span>
              </label>

              {dbaChecked && (
                <Field>
                  <FieldLabel htmlFor="dba-request">검증받을 내용</FieldLabel>
                  <Textarea
                    id="dba-request"
                    rows={3}
                    value={dbaRequest}
                    placeholder="예: 납입내역 조회 쿼리 인덱스 설계와 5년치 조회 성능"
                    onChange={(event) => setDbaRequest(event.target.value)}
                  />
                </Field>
              )}
            </div>
          )}
        </TransitionEvidenceDialog>
      )}
    </>
  )
}
