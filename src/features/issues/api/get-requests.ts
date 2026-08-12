import { queryOptions } from '@tanstack/react-query'
import { format } from 'date-fns'

import type {
  Attachment,
  EvidenceContent,
  ReferenceLink,
  Request,
  RequestStatus,
  StatusHistoryEntry,
  Subtask,
  SubtaskStatus,
  TransitionEvidence,
} from '@/features/issues/api/types'
import { supabase } from '@/shared/lib/supabase'
import type { Database } from '@/shared/types/database'

type Tables = Database['public']['Tables']

/**
 * 이슈 한 건이 화면에 필요한 전부 — 하위작업·증적·결재·이력까지 한 번에 가져온다.
 * 이슈가 수십 건 규모라 트리 전체를 한 쿼리로 받는 편이 단순하고 빠르다.
 */
const REQUEST_TREE_SELECT = `
  *,
  requester:profiles!requests_requester_id_fkey(name, dept, contact),
  attachments(*),
  approvals(*),
  evidences(*, reference_links(*), attachments(*)),
  status_history(*),
  subtasks(
    *,
    assignee:profiles!subtasks_assignee_id_fkey(name, dept),
    approvals(*),
    evidences(*, reference_links(*), attachments(*)),
    status_history(*),
    subtask_branches(*)
  )
`

/** DB는 시각을 timestamptz로 갖고, 화면은 분 단위 문자열을 그대로 출력한다 */
const toDateTime = (value: string) => format(new Date(value), 'yyyy-MM-dd HH:mm')

/**
 * 제출·증적 기록처럼 날짜 단위로 읽는 값. 결재·상태 이력은 시각까지 보여주므로
 * `toDateTime`을 쓴다 — 어느 쪽인지는 화면 표기 기준을 따른다.
 */
const toDate = (value: string) => format(new Date(value), 'yyyy-MM-dd')

type EvidenceRow = Tables['evidences']['Row'] & {
  reference_links: Tables['reference_links']['Row'][]
  attachments: Tables['attachments']['Row'][]
}

type SubtaskRow = Tables['subtasks']['Row'] & {
  assignee: Pick<Tables['profiles']['Row'], 'name' | 'dept'> | null
  approvals: Tables['approvals']['Row'][]
  evidences: EvidenceRow[]
  status_history: Tables['status_history']['Row'][]
  // unique 제약 때문에 PostgREST가 1:1 관계로 인식해 배열이 아닌 단일 객체(또는 null)를 준다
  subtask_branches: Tables['subtask_branches']['Row'] | null
}

type RequestRow = Tables['requests']['Row'] & {
  requester: Pick<Tables['profiles']['Row'], 'name' | 'dept' | 'contact'> | null
  attachments: Tables['attachments']['Row'][]
  approvals: Tables['approvals']['Row'][]
  evidences: EvidenceRow[]
  status_history: Tables['status_history']['Row'][]
  subtasks: SubtaskRow[]
}

const toLinks = (rows: Tables['reference_links']['Row'][]): ReferenceLink[] =>
  [...rows]
    .sort((a, b) => a.position - b.position || a.id - b.id)
    .map((row) => ({ url: row.url, label: row.label }))

const toAttachments = (rows: Tables['attachments']['Row'][]): Attachment[] =>
  [...rows].sort((a, b) => a.id - b.id).map((row) => ({ fileName: row.file_name, size: row.size }))

const toApprovals = (rows: Tables['approvals']['Row'][]) =>
  [...rows]
    .sort((a, b) => a.id - b.id)
    .map((row) => ({
      kind: row.kind,
      approvedBy: row.approved_by,
      approvedAt: toDateTime(row.approved_at),
    }))

/** 화면은 최신 항목을 위에 놓는다 */
const toHistory = (rows: Tables['status_history']['Row'][]): StatusHistoryEntry[] =>
  [...rows]
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id - a.id)
    .map((row) => ({
      id: row.id,
      occurredAt: toDateTime(row.occurred_at),
      actorName: row.actor_name,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      via: row.via,
      reason: row.reason,
    }))

const toEvidenceContent = (row: EvidenceRow): EvidenceContent => ({
  links: toLinks(row.reference_links),
  attachments: toAttachments(row.attachments),
  memo: row.memo,
})

/** 같은 단계가 여러 건이면 마지막 건이 유효값이라 기록 순서를 그대로 지킨다 */
const sortEvidences = (rows: EvidenceRow[]) =>
  [...rows].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at) || a.id - b.id)

function toSubtask(row: SubtaskRow): Subtask {
  const branchRow = row.subtask_branches

  return {
    issueNo: row.issue_no,
    parentIssueNo: row.parent_issue_no,
    type: row.type,
    title: row.title,
    description: row.description,
    status: row.status,
    assignee: { name: row.assignee?.name ?? '', dept: row.assignee?.dept ?? '' },
    dueDate: row.due_date,
    completedAt: row.completed_at,
    dbaVerificationRequest: row.dba_verification_request,
    approvals: toApprovals(row.approvals),
    evidences: sortEvidences(row.evidences).map<TransitionEvidence<SubtaskStatus>>((evidence) => ({
      ...toEvidenceContent(evidence),
      // 하위작업 증적은 CHECK 제약이 subtask_status를 강제한다
      status: evidence.subtask_status!,
      recordedBy: evidence.recorded_by,
      recordedAt: toDate(evidence.recorded_at),
    })),
    history: toHistory(row.status_history),
    branch: branchRow
      ? {
          repoFullName: branchRow.repo_full_name,
          branchName: branchRow.branch_name,
          branchUrl: branchRow.branch_url,
        }
      : null,
  }
}

function toRequest(row: RequestRow): Request {
  return {
    issueNo: row.issue_no,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    requester: {
      name: row.requester?.name ?? '',
      dept: row.requester?.dept ?? '',
      contact: row.requester?.contact ?? '',
    },
    dueDate: row.due_date,
    createdAt: row.created_at,
    submittedAt: row.submitted_at === null ? null : toDate(row.submitted_at),
    handlesPersonalData: row.handles_personal_data,
    consumerProtectionTarget: row.consumer_protection_target,
    darkPatternChecked: row.dark_pattern_checked,
    attachments: toAttachments(row.attachments),
    // 채번이 곧 생성 순서라 번호순이 등록 순서다
    subtasks: [...row.subtasks].sort((a, b) => a.issue_no.localeCompare(b.issue_no)).map(toSubtask),
    approvals: toApprovals(row.approvals),
    evidences: sortEvidences(row.evidences).map<TransitionEvidence<RequestStatus>>((evidence) => ({
      ...toEvidenceContent(evidence),
      // 이슈 증적은 CHECK 제약이 request_status를 강제한다
      status: evidence.request_status!,
      recordedBy: evidence.recorded_by,
      recordedAt: toDate(evidence.recorded_at),
    })),
    history: toHistory(row.status_history),
  }
}

export const getRequestsService = async (): Promise<Request[]> => {
  const { data, error } = await supabase.from('requests').select(REQUEST_TREE_SELECT)
  if (error) throw error

  return (data as unknown as RequestRow[])
    .map(toRequest)
    .sort((a, b) => b.issueNo.localeCompare(a.issueNo))
}

export const getRequestsQueryKeyPrefix = () => ['/requests'] as const

export const getRequestsQueryKey = () => [...getRequestsQueryKeyPrefix()] as const

export const getRequestsQueryOptions = () =>
  queryOptions({
    queryKey: getRequestsQueryKey(),
    queryFn: getRequestsService,
  })
