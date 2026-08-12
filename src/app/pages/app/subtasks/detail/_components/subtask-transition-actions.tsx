import { useState } from 'react'
import { toast } from 'sonner'

import { useTransitionSubtaskMutation } from '@/features/issues/api/transition-subtask'
import type { Request, Subtask } from '@/features/issues/api/types'
import { TransitionEvidenceDialog } from '@/features/issues/components/transition-evidence-dialog'
import { SUBTASK_ADVANCE_LABEL, SUBTASK_STATUS_META } from '@/features/issues/constants/metadata'
import { EVIDENCE_HINT } from '@/features/issues/constants/transition-evidence'
import {
  getNextSubtaskStatus,
  getPostDevelopmentStatus,
} from '@/features/issues/constants/transitions'
import { getSubtaskDeployGate } from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Field, FieldLabel } from '@/shared/components/ui/field'
import { Textarea } from '@/shared/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useConfirm } from '@/shared/hooks/use-confirm'

type SubtaskTransitionActionsProps = {
  subtask: Subtask
  request: Request
  /** 전이는 담당자·리드만 가능 (스펙 §5.3) */
  canTransition: boolean
}

export function SubtaskTransitionActions({
  subtask,
  request,
  canTransition,
}: SubtaskTransitionActionsProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [dbaChecked, setDbaChecked] = useState(false)
  const [dbaRequest, setDbaRequest] = useState('')
  const { user } = useCurrentUser()
  const confirm = useConfirm()
  const transitionSubtask = useTransitionSubtaskMutation()

  const label = SUBTASK_ADVANCE_LABEL[subtask.status]
  // 이행은 부모 인수 확인이 끝나야 가능하다 (시나리오 17)
  const deployGate = getSubtaskDeployGate(request, subtask)
  const hint = EVIDENCE_HINT[subtask.status]

  // DBA 검증중은 결재가 떨어지면 자동으로 넘어가고, 완료는 더 갈 곳이 없다
  if (!label) return null

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
    // 감싸는 행은 패널이 갖는다 — 버튼이 상태 칩과 같은 flex 줄에 놓여야 한다
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button
              disabled={!canTransition || nextStatus === null || deployGate.blocked}
              onClick={handleForward}
            >
              {label}
            </Button>
          </span>
        </TooltipTrigger>
        {deployGate.reason && <TooltipContent>{deployGate.reason}</TooltipContent>}
      </Tooltip>

      {/* 단계가 바뀌면 리마운트해 이전 단계의 입력값이 남지 않게 한다 */}
      <TransitionEvidenceDialog
        key={subtask.status}
        open={evidenceOpen}
        title={label}
        hint={hint ?? ''}
        outcome={nextStatus ? SUBTASK_STATUS_META[nextStatus].label : undefined}
        confirmLabel={label}
        confirmDisabled={isDevelopmentStep && dbaChecked && dbaRequest.trim().length === 0}
        onOpenChange={(open) => {
          setEvidenceOpen(open)
          // 팝업은 key로 리셋되지만 DBA 입력은 밖에 있어 직접 비운다
          if (!open) {
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
              ...(isDevelopmentStep && { dbaVerificationRequest: dbaChecked ? dbaRequest : null }),
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
    </>
  )
}
