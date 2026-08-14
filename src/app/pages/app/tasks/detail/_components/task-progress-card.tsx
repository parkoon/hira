import { useState } from 'react'
import { toast } from 'sonner'

import { useTransitionTaskMutation } from '@/features/tasks/api/transition-task'
import type { Task, TaskStatus } from '@/features/tasks/api/types'
import { ActionButton } from '@/features/tasks/components/action-button'
import { PanelCard } from '@/features/tasks/components/panel-card'
import { RejectReasonDialog } from '@/features/tasks/components/reject-reason-dialog'
import { TransitionEvidenceDialog } from '@/features/tasks/components/transition-evidence-dialog'
import { WorkflowSteps } from '@/features/tasks/components/workflow-steps'
import { TASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { TASK_EVIDENCE_HINT } from '@/features/tasks/constants/transition-evidence'
import { TASK_FLOW } from '@/features/tasks/constants/transitions'
import {
  canConfirmAcceptance,
  canSubmitTask,
  getTaskAdvanceState,
  getTaskApproveState,
} from '@/features/tasks/utils/task-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { useConfirm } from '@/shared/hooks/use-confirm'

import { CompleteTaskDialog } from './complete-task-dialog'

/** 흐름을 한 칸 앞으로 미는 액션. 상태마다 하나뿐이라 카드 제목 줄에 올린다 */
type ForwardAction = {
  label: string
  /** 있으면 막고 이유를 툴팁으로 보여준다 */
  reason?: string | null
  onClick: () => void
}

/**
 * 상태에 관한 전부 — 지금 어디까지 왔는지(레일)와 어디로 갈 수 있는지(액션)를 한 카드에 둔다.
 * 앞으로 가는 길은 제목 줄에, 흐름을 벗어나는 길(회수·반려)은 레일 아래에 둬 위계를 자리로 드러낸다.
 */
export function TaskProgressCard({ task }: { task: Task }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const { user, hasRole } = useCurrentUser()
  const confirm = useConfirm()
  const transitionTask = useTransitionTaskMutation()

  const isLead = hasRole('LEAD')
  const isRequester = task.requester.id === user.id

  /** confirm을 거쳐 전이한다 — 모든 상태변화에 확인 팝업 (시나리오 각주 1) */
  const confirmTransition = (input: {
    action: string
    description: string
    toStatus: TaskStatus
    successMessage: string
  }) => {
    void confirm
      .open({
        title: `${task.taskNo} ${input.action}`,
        description: input.description,
        confirm: { text: input.action },
      })
      .then((ok) => {
        if (!ok) return
        transitionTask.mutate(
          { taskNo: task.taskNo, toStatus: input.toStatus, actorName: user.name },
          { onSuccess: () => toast.success(input.successMessage) }
        )
      })
  }

  const resolveForwardAction = (): ForwardAction | null => {
    // 승인 요청 — 요청대기중·반려 상태의 등록자 (시나리오 2)
    if (canSubmitTask(task, user)) {
      return {
        label: '승인 요청',
        onClick: () =>
          confirmTransition({
            action: '승인 요청',
            description:
              '승인을 요청하면 리드가 검토·승인할 수 있게 되고, 그때까지 내용을 수정할 수 없습니다.',
            toStatus: 'PENDING_APPROVAL',
            successMessage: `${task.taskNo} 작업의 승인을 요청했습니다.`,
          }),
      }
    }

    // 승인 — 요청승인대기중의 리드 (시나리오 3)
    if (task.status === 'PENDING_APPROVAL' && isLead) {
      return {
        label: '승인',
        reason: getTaskApproveState(task, user).reason,
        onClick: () =>
          confirmTransition({
            action: '승인',
            description:
              '승인하면 작업이 작업중으로 전이되고, 이후 작업 본문·첨부·컴플라이언스 응답은 수정할 수 없습니다.',
            toStatus: 'IN_PROGRESS',
            successMessage: `${task.taskNo} 작업을 승인했습니다.`,
          }),
      }
    }

    // 인수테스트 요청 — 작업중의 리드 (시나리오 13)
    if (task.status === 'IN_PROGRESS' && isLead) {
      return {
        label: '인수테스트 요청',
        reason: getTaskAdvanceState(task).reason,
        onClick: () =>
          confirmTransition({
            action: '인수테스트 요청',
            description: `${task.taskNo} 작업이 ${TASK_STATUS_META.ACCEPTANCE.label}(으)로 바뀌고, 요청자에게 인수 확인 버튼이 뜹니다.`,
            toStatus: 'ACCEPTANCE',
            successMessage: '인수테스트를 요청했습니다.',
          }),
      }
    }

    // 인수 확인 — 등록자 본인만 (시나리오 14·15)
    if (task.status === 'ACCEPTANCE' && canConfirmAcceptance(task, user)) {
      return { label: '인수 확인', onClick: () => setEvidenceOpen(true) }
    }

    // 최종 완료 — 전 하위작업 완료 후 리드가 (시나리오 19)
    if (task.status === 'DEPLOY_WAITING' && isLead) {
      return {
        label: '최종 완료',
        reason: getTaskAdvanceState(task).reason,
        onClick: () => setCompleteOpen(true),
      }
    }

    return null
  }

  const forward = resolveForwardAction()
  // 회수·반려는 요청승인대기중에만 있다 (시나리오 3)
  const canWithdraw = task.status === 'PENDING_APPROVAL' && isRequester
  const canReject = task.status === 'PENDING_APPROVAL' && isLead

  return (
    <>
      <PanelCard
        title="진행 상태"
        action={
          forward && (
            <ActionButton
              label={forward.label}
              reason={forward.reason}
              pending={transitionTask.isPending}
              variant="default"
              onClick={forward.onClick}
            />
          )
        }
      >
        <WorkflowSteps
          steps={TASK_FLOW.map((status) => TASK_STATUS_META[status].label)}
          currentIndex={TASK_FLOW.indexOf(task.status)}
          note={
            task.status === 'REJECTED'
              ? '반려는 이 흐름 밖입니다. 승인을 다시 요청하면 요청승인대기중으로 돌아갑니다.'
              : undefined
          }
        />

        {/* 흐름 밖 경로는 링크 톤으로 낮춘다 — 보이되 시선은 제목 줄의 주 버튼이 먼저 가져간다 */}
        {(canWithdraw || canReject) && (
          <div className="mt-3 flex items-center gap-3 border-t pt-2">
            {canWithdraw && (
              <ActionButton
                label="회수"
                variant="link"
                size="sm"
                pending={transitionTask.isPending}
                onClick={() =>
                  confirmTransition({
                    action: '회수',
                    description: '회수하면 요청대기중으로 돌아가 내용을 다시 수정할 수 있습니다.',
                    toStatus: 'DRAFT',
                    successMessage: `${task.taskNo} 작업을 회수했습니다.`,
                  })
                }
              />
            )}
            {canReject && (
              <ActionButton
                label="반려"
                variant="link"
                size="sm"
                className="text-destructive"
                reason={isRequester ? '본인이 등록한 작업은 직접 반려할 수 없어요' : null}
                pending={transitionTask.isPending}
                onClick={() => setRejectOpen(true)}
              />
            )}
          </div>
        )}
      </PanelCard>

      {/* 팝업은 카드 밖 형제로 둔다 — 카드가 다시 그려져도 입력하던 팝업이 살아 있어야 한다 */}
      {evidenceOpen && (
        <TransitionEvidenceDialog
          open
          title="인수 확인"
          hint={TASK_EVIDENCE_HINT.ACCEPTANCE ?? ''}
          outcome={TASK_STATUS_META.DEPLOY_WAITING.label}
          confirmLabel="인수 확인"
          confirmDisabled={transitionTask.isPending}
          onOpenChange={setEvidenceOpen}
          onConfirm={(evidence) => {
            transitionTask.mutate(
              {
                taskNo: task.taskNo,
                toStatus: 'DEPLOY_WAITING',
                actorName: user.name,
                evidence,
              },
              {
                onSuccess: () =>
                  toast.success('인수 확인을 마쳤습니다. 이제 하위작업을 이행할 수 있어요.'),
              }
            )
          }}
        />
      )}

      <CompleteTaskDialog
        task={task}
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onConfirm={() => {
          transitionTask.mutate(
            { taskNo: task.taskNo, toStatus: 'DONE', actorName: user.name },
            { onSuccess: () => toast.success(`${task.taskNo} 작업을 최종 완료했습니다.`) }
          )
        }}
      />

      <RejectReasonDialog
        task={rejectOpen ? task : null}
        onOpenChange={(open) => !open && setRejectOpen(false)}
        onConfirm={(reason) => {
          transitionTask.mutate(
            { taskNo: task.taskNo, toStatus: 'REJECTED', actorName: user.name, reason },
            { onSuccess: () => toast.success(`${task.taskNo} 작업을 반려했습니다.`) }
          )
        }}
      />
    </>
  )
}
