import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { useAttachFilesMutation } from '@/features/issues/api/attach-files'
import { useCreateSubtaskMutation } from '@/features/issues/api/create-subtask'
import { useDeleteAttachmentsMutation } from '@/features/issues/api/delete-attachments'
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
import { Empty } from '@/shared/components/ui/empty'
import { Page } from '@/shared/components/ui/layout/page'
import { paths } from '@/shared/config/paths'

import { RequestAcceptanceCard } from './_components/request-acceptance-card'
import { RequestActionsMenu } from './_components/request-actions-menu'
import { RequestActivity } from './_components/request-activity'
import { RequestAttachments } from './_components/request-attachments'
import { RequestDetailPanel } from './_components/request-detail-panel'
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
  const deleteAttachments = useDeleteAttachmentsMutation()

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
            actions={
              <RequestActionsMenu
                request={request}
                canEdit={canEditRequest(request, user)}
                onEdit={() => setEditOpen(true)}
              />
            }
          />

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">설명</h2>
            <IssueDescription html={request.description} />
          </section>

          <RequestAttachments request={request} />
          <SubtaskList
            request={request}
            canCreate={canCreateSubtask}
            createBlockedReason={
              request.status === 'IN_PROGRESS'
                ? null
                : '작업중 상태에서만 하위작업을 만들 수 있어요'
            }
            onCreate={() => setSubtaskCreateOpen(true)}
          />
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
          // 첨부 가능 조건이 수정 가능 조건과 같아 한 폼에 둔다 — 규칙이 갈라질 자리를 없앤다
          withAttachments
          existingAttachments={request.attachments}
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
                  // 첨부는 이력을 따로 남기는 별개 동작이라 내용 수정과 나눠 부른다
                  const removed = request.attachments.filter((attachment) =>
                    values.removedAttachmentIds.includes(attachment.id)
                  )
                  if (removed.length > 0) {
                    deleteAttachments.mutate(
                      { issueNo: request.issueNo, attachments: removed, actorName: user.name },
                      {
                        onSuccess: () => toast.success(`첨부 ${removed.length}개를 뗐습니다.`),
                      }
                    )
                  }
                  if (values.attachments.length > 0) {
                    attachFiles.mutate(
                      {
                        issueNo: request.issueNo,
                        files: values.attachments,
                        actorName: user.name,
                      },
                      {
                        onSuccess: () =>
                          toast.success(`${values.attachments.length}개 파일을 첨부했습니다.`),
                      }
                    )
                  }
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
