import { useSuspenseQuery } from '@tanstack/react-query'
import { SquarePlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { useAttachFilesMutation } from '@/features/issues/api/attach-files'
import { useCreateSubtaskMutation } from '@/features/issues/api/create-subtask'
import { getRequestsQueryOptions } from '@/features/issues/api/get-requests'
import { IssueDescription } from '@/features/issues/components/issue-description'
import { IssueDetailHeader } from '@/features/issues/components/issue-detail-header'
import {
  canConfirmAcceptance,
  canViewRequest,
  selectRequestByIssueNo,
} from '@/features/issues/utils/issue-selectors'
import { getUsersQueryOptions } from '@/features/users/api/get-users'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { selectAssignableUsers } from '@/features/users/utils/user-selectors'
import { Button } from '@/shared/components/ui/button'
import { Empty } from '@/shared/components/ui/empty'
import { Page } from '@/shared/components/ui/layout/page'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { paths } from '@/shared/config/paths'

import { AttachFileButton } from './_components/attach-file-button'
import { RequestAcceptanceCard } from './_components/request-acceptance-card'
import { RequestActivity } from './_components/request-activity'
import { RequestAttachments } from './_components/request-attachments'
import { RequestDetailPanel } from './_components/request-detail-panel'
import { SubtaskCreateModal } from './_components/subtask-create-modal'
import { SubtaskList } from './_components/subtask-list'

/** 화면 6 — 이슈 상세 (Jira 신규 이슈 뷰 배치) */
function RequestDetailPage() {
  const { issueNo = '' } = useParams()
  const { user, hasRole } = useCurrentUser()
  const [subtaskCreateOpen, setSubtaskCreateOpen] = useState(false)

  const requestsQuery = useSuspenseQuery(getRequestsQueryOptions())
  const usersQuery = useSuspenseQuery(getUsersQueryOptions())
  const createSubtask = useCreateSubtaskMutation()
  const attachFiles = useAttachFilesMutation()

  const request = selectRequestByIssueNo(requestsQuery.data, issueNo)

  // 요청자는 본인이 등록한 건만 볼 수 있다 (스펙 §3.3) — 목록과 같은 규칙을 URL 직접 접근에도 적용한다
  const visible = request !== undefined && canViewRequest(request, user)

  if (!request || !visible) {
    return (
      <Empty
        className="m-6 w-auto"
        title="이슈를 찾을 수 없습니다"
        description={`${issueNo}에 해당하는 이슈가 없습니다.`}
      />
    )
  }

  // 하위작업 생성은 작업자도 가능하다 (스펙 §5.1의 리드 전용 규칙에서 완화)
  const canCreateSubtask = hasRole('WORKER')
  const subtaskCreateBlocked = request.status !== 'IN_PROGRESS'

  return (
    <Page>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <IssueDetailHeader
            breadcrumb={[
              { label: '이슈 목록', to: paths.app.issues.root.getHref() },
              { label: request.issueNo },
            ]}
            title={request.title}
            quickActions={
              <>
                <AttachFileButton
                  request={request}
                  onAttach={(files) =>
                    attachFiles.mutate(
                      {
                        issueNo: request.issueNo,
                        files,
                        actorName: user.name,
                      },
                      {
                        onSuccess: () => toast.success(`${files.length}개 파일을 첨부했습니다.`),
                      }
                    )
                  }
                />

                {canCreateSubtask && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="하위작업 만들기"
                          disabled={subtaskCreateBlocked}
                          onClick={() => setSubtaskCreateOpen(true)}
                        >
                          <SquarePlusIcon />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {subtaskCreateBlocked
                        ? '작업중 상태에서만 하위작업을 만들 수 있어요'
                        : '하위작업 만들기'}
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            }
          />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">설명</h2>
            <IssueDescription html={request.description} />
          </section>

          <RequestAttachments request={request} />
          <SubtaskList request={request} />
          {/* 정정 권한은 기록 권한과 같다 — 등록자가 남긴 증적을 등록자가 못 고치면 안 된다 */}
          <RequestAcceptanceCard
            request={request}
            canEdit={canConfirmAcceptance(request, user)}
          />
          <RequestActivity request={request} />
        </div>

        {/*
          패널이 화면보다 길어질 수 있어 자체 스크롤을 준다. sticky만 걸면 넘치는 아래쪽에
          닿을 수 없다. px-1/-mx-1은 카드 테두리(ring = 바깥 box-shadow)가 스크롤 경계에
          잘리지 않게 좌우 여유를 두고 그만큼 자리를 되돌리는 것이다.
        */}
        <div className="w-full shrink-0 lg:sticky lg:top-3 lg:-m-1 lg:max-h-[calc(100dvh-4.5rem)] lg:w-102 lg:self-start lg:overflow-y-auto lg:p-1">
          <RequestDetailPanel request={request} />
        </div>
      </div>

      <SubtaskCreateModal
        parentIssueNo={request.issueNo}
        open={subtaskCreateOpen}
        onOpenChange={setSubtaskCreateOpen}
        onSubmit={(values) => {
          const assignee = selectAssignableUsers(usersQuery.data).find(
            (candidate) => candidate.loginId === values.assigneeLoginId
          )
          // 모달이 이미 닫힌 뒤라 조용히 끝내면 생성된 줄 안다 — 드물지만(목록 갱신 경합) 알려준다
          if (!assignee) {
            toast.error('담당자를 찾을 수 없습니다. 하위작업을 다시 생성해 주세요.')
            return
          }

          createSubtask.mutate(
            {
              parentIssueNo: request.issueNo,
              draft: {
                type: values.type,
                title: values.title,
                description: values.description,
                assignee: { id: assignee.id, name: assignee.name, dept: assignee.dept },
                dueDate: values.dueDate,
              },
              actorName: user.name,
            },
            { onSuccess: () => toast.success(`하위작업 "${values.title}"을(를) 생성했습니다.`) }
          )
        }}
      />
    </Page>
  )
}

export { RequestDetailPage as Component }
