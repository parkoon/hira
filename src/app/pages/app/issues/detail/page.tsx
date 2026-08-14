import { useSuspenseQuery } from '@tanstack/react-query'
import { PencilIcon, SquarePlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { useAttachFilesMutation } from '@/features/issues/api/attach-files'
import { useCreateSubtaskMutation } from '@/features/issues/api/create-subtask'
import { getRequestsQueryOptions } from '@/features/issues/api/get-requests'
import { useUpdateRequestMutation } from '@/features/issues/api/update-request'
import { IssueDescription } from '@/features/issues/components/issue-description'
import { IssueDetailHeader } from '@/features/issues/components/issue-detail-header'
import { RequestFormModal } from '@/features/issues/components/request-form/request-form-modal'
import { SubtaskFormModal } from '@/features/issues/components/subtask-form-modal'
import {
  canConfirmAcceptance,
  canEditRequest,
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
import { RequestStatusActions } from './_components/request-status-actions'
import { SubtaskList } from './_components/subtask-list'

/** 화면 6 — 이슈 상세 (Jira 신규 이슈 뷰 배치) */
function RequestDetailPage() {
  const { issueNo = '' } = useParams()
  const { user, hasRole } = useCurrentUser()
  const [subtaskCreateOpen, setSubtaskCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const requestsQuery = useSuspenseQuery(getRequestsQueryOptions())
  const usersQuery = useSuspenseQuery(getUsersQueryOptions())
  const createSubtask = useCreateSubtaskMutation()
  const updateRequest = useUpdateRequestMutation()
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
                {/* 정방향 진행은 상태 칩의 워크플로 팝오버가 맡고, 여기는 회수·반려만 */}
                <RequestStatusActions request={request} />

                {/* 제출 전 등록자만 — 검토 중에는 회수해야 고칠 수 있다 (스펙 §3.4) */}
                {canEditRequest(request, user) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="이슈 수정"
                        onClick={() => setEditOpen(true)}
                      >
                        <PencilIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>이슈 수정</TooltipContent>
                  </Tooltip>
                )}

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

      {/* 열 때마다 마운트해 현재 값으로 폼을 채운다 */}
      {editOpen && (
        <RequestFormModal
          open
          onOpenChange={setEditOpen}
          title={`${request.issueNo} 수정`}
          submitLabel="저장"
          defaultValues={{
            title: request.title,
            description: request.description,
            priority: request.priority,
            dueDate: request.dueDate,
            handlesPersonalData: request.handlesPersonalData ? 'YES' : 'NO',
            consumerProtectionTarget: request.consumerProtectionTarget ? 'YES' : 'NO',
            darkPatternChecked: request.darkPatternChecked,
          }}
          pending={updateRequest.isPending}
          onSubmit={(values) =>
            updateRequest.mutate(
              {
                issueNo: request.issueNo,
                draft: {
                  title: values.title,
                  description: values.description,
                  priority: values.priority,
                  dueDate: values.dueDate,
                  handlesPersonalData: values.handlesPersonalData === 'YES',
                  consumerProtectionTarget: values.consumerProtectionTarget === 'YES',
                  darkPatternChecked: values.darkPatternChecked,
                },
                actorName: user.name,
              },
              {
                onSuccess: (changed) => {
                  setEditOpen(false)
                  // 값이 그대로면 아무것도 기록되지 않으므로 수정했다고 알리지 않는다
                  if (changed) toast.success(`${request.issueNo} 이슈를 수정했습니다.`)
                },
              }
            )
          }
        />
      )}

      <SubtaskFormModal
        open={subtaskCreateOpen}
        onOpenChange={setSubtaskCreateOpen}
        title="하위작업 생성"
        submitLabel="생성"
        assignableUsers={selectAssignableUsers(usersQuery.data)}
        onSubmit={(draft) =>
          createSubtask.mutate(
            { parentIssueNo: request.issueNo, draft, actorName: user.name },
            { onSuccess: () => toast.success(`하위작업 "${draft.title}"을(를) 생성했습니다.`) }
          )
        }
      />
    </Page>
  )
}

export { RequestDetailPage as Component }
