import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'

import { getRequestsQueryOptions } from '@/features/issues/api/get-requests'
import { useReassignSubtaskMutation } from '@/features/issues/api/reassign-subtask'
import { IssueDescription } from '@/features/issues/components/issue-description'
import { IssueDetailHeader } from '@/features/issues/components/issue-detail-header'
import {
  selectRequestByIssueNo,
  selectSubtaskByIssueNo,
} from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Empty } from '@/shared/components/ui/empty'
import { Page } from '@/shared/components/ui/layout/page'
import { paths } from '@/shared/config/paths'

import { SubtaskActionsMenu } from './_components/subtask-actions-menu'
import { SubtaskActivity } from './_components/subtask-activity'
import { SubtaskDetailPanel } from './_components/subtask-detail-panel'
import { TransitionEvidenceCard } from './_components/transition-evidence-card'

/** 화면 8 — 하위작업 상세 (Jira 신규 이슈 뷰 배치) */
function SubtaskDetailPage() {
  const { subtaskNo = '' } = useParams()
  const { user, hasRole } = useCurrentUser()

  const requestsQuery = useSuspenseQuery(getRequestsQueryOptions())
  const reassignSubtask = useReassignSubtaskMutation()

  const subtask = selectSubtaskByIssueNo(requestsQuery.data, subtaskNo)
  const request = subtask
    ? selectRequestByIssueNo(requestsQuery.data, subtask.parentIssueNo)
    : undefined

  if (!subtask || !request) {
    return (
      <Empty
        className="m-6 w-auto"
        title="하위작업을 찾을 수 없습니다"
        description={`${subtaskNo}에 해당하는 하위작업이 없습니다.`}
      />
    )
  }

  // 담당자 본인 또는 리드 이상만 전이할 수 있다 (스펙 §5.2)
  const canTransition = hasRole('LEAD') || subtask.assignee.name === user.name
  // 하위작업 배정·삭제는 작업자 이상이 수행한다 (스펙 §5.1)
  const canManageSubtask = hasRole('WORKER')

  return (
    <Page>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <IssueDetailHeader
            breadcrumb={[
              { label: '이슈 목록', to: paths.app.issues.root.getHref() },
              {
                label: subtask.parentIssueNo,
                to: paths.app.issues.detail.getHref(subtask.parentIssueNo),
              },
              { label: subtask.issueNo },
            ]}
            title={subtask.title}
            actions={
              <SubtaskActionsMenu
                subtask={subtask}
                canDelete={canManageSubtask}
              />
            }
          />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">설명</h2>
            <IssueDescription html={subtask.description} />
          </section>

          <TransitionEvidenceCard
            subtask={subtask}
            canEdit={canTransition}
          />

          <SubtaskActivity subtask={subtask} />
        </div>

        {/*
          패널이 화면보다 길어질 수 있어(진행 단계 9칸) 자체 스크롤을 준다. sticky만 걸면
          넘치는 아래쪽에 닿을 수 없다. px-1/-mx-1은 카드 테두리(ring = 바깥 box-shadow)가
          스크롤 경계에 잘리지 않게 좌우 여유를 두고 그만큼 자리를 되돌리는 것이다.
        */}
        <div className="w-full shrink-0 lg:sticky lg:top-3 lg:-m-1 lg:max-h-[calc(100dvh-4.5rem)] lg:w-102 lg:self-start lg:overflow-y-auto lg:p-1">
          <SubtaskDetailPanel
            subtask={subtask}
            request={request}
            canTransition={canTransition}
            canReassign={canManageSubtask}
            onReassign={(assignee) =>
              reassignSubtask.mutate({ subtaskNo: subtask.issueNo, assignee })
            }
          />
        </div>
      </div>
    </Page>
  )
}

export { SubtaskDetailPage as Component }
