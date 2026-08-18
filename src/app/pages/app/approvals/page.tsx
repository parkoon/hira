import { useSuspenseQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks'
import { useTransitionTaskMutation } from '@/features/tasks/api/transition-task'
import type { Task } from '@/features/tasks/api/types'
import { RejectReasonDialog } from '@/features/tasks/components/reject-reason-dialog'
import {
  getTaskApproveState,
  selectPendingApprovalTasks,
} from '@/features/tasks/utils/task-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Page } from '@/shared/components/ui/layout/page'
import { useConfirm } from '@/shared/hooks/use-confirm'

import { ApprovalFilters } from './_components/approval-filters'
import { ApprovalsTable } from './_components/approvals-table'
import { applyApprovalFilters, approvalFilterParsers } from './_utils/approval-filters'

/** 화면 5 — 승인 대기함 (리드 이상, 스펙 §6-5) */
function ApprovalInboxPage() {
  const { user } = useCurrentUser()
  const confirm = useConfirm()
  const [rejectTarget, setRejectTarget] = useState<Task | null>(null)
  const [filters] = useQueryStates(approvalFilterParsers)

  const tasksQuery = useSuspenseQuery(getTasksQueryOptions())
  const transitionTask = useTransitionTaskMutation()

  const pendingTasks = useMemo(() => selectPendingApprovalTasks(tasksQuery.data), [tasksQuery.data])
  const requesters = useMemo(
    () => [...new Set(pendingTasks.map((task) => task.requester.name))],
    [pendingTasks]
  )
  const tasks = useMemo(() => applyApprovalFilters(pendingTasks, filters), [pendingTasks, filters])

  const isSelfRegistered = useCallback((task: Task) => task.requester.id === user.id, [user.id])

  const getApproveState = useCallback((task: Task) => getTaskApproveState(task, user), [user])

  const handleApprove = useCallback(
    (task: Task) => {
      void confirm
        .open({
          title: `${task.taskNo} 승인`,
          description:
            '승인하면 작업이 작업중으로 전이되고, 이후 작업 본문·첨부·컴플라이언스 응답은 수정할 수 없습니다.',
          confirm: { text: '승인' },
        })
        .then((ok) => {
          if (!ok) return
          transitionTask.mutate(
            { taskNo: task.taskNo, toStatus: 'IN_PROGRESS', actorName: user.name },
            { onSuccess: () => toast.success(`${task.taskNo} 작업을 승인했습니다.`) }
          )
        })
    },
    [confirm, transitionTask, user.name]
  )

  const handleReject = useCallback((task: Task) => setRejectTarget(task), [])

  return (
    <Page
      className="overflow-y-hidden"
      noContentPadding
    >
      <div className="mb-3 px-2 pt-2">
        <ApprovalFilters requesters={requesters} />
      </div>

      <ApprovalsTable
        tasks={tasks}
        isSelfRegistered={isSelfRegistered}
        getApproveState={getApproveState}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <RejectReasonDialog
        task={rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onConfirm={(reason) => {
          if (!rejectTarget) return
          transitionTask.mutate(
            { taskNo: rejectTarget.taskNo, toStatus: 'REJECTED', actorName: user.name, reason },
            { onSuccess: () => toast.success(`${rejectTarget.taskNo} 작업을 반려했습니다.`) }
          )
        }}
      />
    </Page>
  )
}

export { ApprovalInboxPage as Component }
