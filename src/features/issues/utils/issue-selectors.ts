import type {
  Approval,
  ApprovalKind,
  Request,
  RequestStatus,
  Subtask,
  SubtaskStatus,
} from '@/features/issues/api/types'
import { getSubtaskFlow, SUBTASK_READY_STATUS } from '@/features/issues/constants/transitions'
import type { User } from '@/features/users/api/types'
import { ROLE_LEVEL } from '@/features/users/constants/metadata'

/**
 * 이슈 열람 권한 — 요청자는 본인이 등록한 건만 볼 수 있다 (스펙 §3.3).
 * 목록과 상세(직접 URL 접근)가 같은 규칙을 쓴다.
 */
export function canViewRequest(request: Request, user: User): boolean {
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL.WORKER || request.requester.id === user.id
}

/**
 * 목록에 노출할 이슈.
 * - 임시저장(요청대기중) 건은 목록에 노출하지 않는다 (스펙 §4.3)
 * - 열람 권한은 `canViewRequest`와 같은 규칙이다
 */
export function selectVisibleRequests(requests: Request[], user: User): Request[] {
  return requests.filter((request) => request.status !== 'DRAFT' && canViewRequest(request, user))
}

/** 승인 대기함 대상 — 리드가 결정해야 할 제출 건 */
export function selectPendingApprovalRequests(requests: Request[]): Request[] {
  return requests.filter((request) => request.status === 'PENDING_APPROVAL')
}

export function selectRequestByIssueNo(requests: Request[], issueNo: string): Request | undefined {
  return requests.find((request) => request.issueNo === issueNo)
}

export function selectSubtaskByIssueNo(requests: Request[], issueNo: string): Subtask | undefined {
  return requests
    .flatMap((request) => request.subtasks)
    .find((subtask) => subtask.issueNo === issueNo)
}

/** 내 작업함 — 본인이 담당자인 하위작업. 동명이인이 있어도 안전하게 id로 식별한다 */
export function selectSubtasksByAssignee(requests: Request[], assigneeId: string): Subtask[] {
  return requests
    .flatMap((request) => request.subtasks)
    .filter((subtask) => subtask.assignee.id === assigneeId)
}

export function getSubtaskProgress(request: Request) {
  const total = request.subtasks.length
  const done = request.subtasks.filter((subtask) => subtask.status === 'DONE').length
  return { done, total }
}

/**
 * 하위작업 삭제 가능 여부 — 스펙 §5.1, §11.3.
 * 한 번이라도 전이된 하위작업은 이력 보존을 위해 삭제할 수 없다.
 */
export function getSubtaskDeletionState(subtask: Subtask) {
  if (subtask.status !== 'TODO') {
    return { enabled: false, reason: '작업대기중 상태에서만 삭제할 수 있어요' }
  }
  if (subtask.history.length > 0) {
    return { enabled: false, reason: '상태 전이 이력이 있어 삭제할 수 없어요' }
  }
  return { enabled: true, reason: null }
}

/**
 * 하위작업 내용(제목·설명·담당자·목표일) 수정 가능 여부.
 * 완료된 건은 기록이 확정된 것으로 본다. 권한은 화면이 따로 판정한다 (삭제와 같은 방식).
 */
export function getSubtaskEditState(subtask: Subtask) {
  if (subtask.status === 'DONE') {
    return { enabled: false, reason: '완료된 하위작업은 수정할 수 없어요' }
  }
  return { enabled: true, reason: null }
}

/**
 * 해당 단계의 유효한 증적과 정정 횟수 (시나리오 각주 3).
 * 같은 단계가 여러 건이면 마지막 건이 유효하고, 앞선 건들은 정정 이력이다.
 */
export function getStepEvidence(subtask: Subtask, status: SubtaskStatus) {
  const recorded = subtask.evidences.filter((evidence) => evidence.status === status)
  return {
    latest: recorded.length > 0 ? recorded[recorded.length - 1] : null,
    /** 0이면 최초 기록, 1 이상이면 그만큼 정정됨 */
    revisions: Math.max(recorded.length - 1, 0),
  }
}

/** 증적이 기록된 단계를 워크플로 순서대로 */
export function getEvidenceSteps(subtask: Subtask): SubtaskStatus[] {
  return getSubtaskFlow(subtask).filter((status) =>
    subtask.evidences.some((evidence) => evidence.status === status)
  )
}

/** 세부 사항 패널에 띄우는 배포 완료 URL — 이행 단계 증적의 첫 링크 (시나리오 17) */
export function getDeploymentUrl(subtask: Subtask): string | null {
  return getStepEvidence(subtask, 'DEPLOY_WAITING').latest?.links[0]?.url ?? null
}

/** 부모 단계의 유효한 증적과 정정 횟수 (시나리오 15) */
export function getRequestStepEvidence(request: Request, status: RequestStatus) {
  const recorded = request.evidences.filter((evidence) => evidence.status === status)
  return {
    latest: recorded.length > 0 ? recorded[recorded.length - 1] : null,
    revisions: Math.max(recorded.length - 1, 0),
  }
}

/**
 * 요청 승인 전에 받아야 하는 결재 (시나리오 3).
 * 요건 속성에 따라 붙으므로, 둘 다 아니면 결재 없이 바로 승인할 수 있다.
 */
export function getRequiredApprovals(request: Request): ApprovalKind[] {
  const required: ApprovalKind[] = []
  if (request.handlesPersonalData) required.push('COMPLIANCE')
  if (request.consumerProtectionTarget) required.push('CONSUMER_PROTECTION')
  return required
}

function getApprovalState(required: ApprovalKind[], approvals: Approval[]) {
  const pending = required.filter((kind) => !approvals.some((approval) => approval.kind === kind))
  return { required, pending, complete: pending.length === 0 }
}

/** 요청 결재 진행 상태 — 임시 승인 버튼이 채운다 (시나리오 각주 2) */
export function getRequestApprovalState(request: Request) {
  return getApprovalState(getRequiredApprovals(request), request.approvals)
}

/** DBA 검증 결재 진행 상태 (시나리오 9) */
export function getSubtaskApprovalState(subtask: Subtask) {
  const required: ApprovalKind[] = subtask.dbaVerificationRequest === null ? [] : ['DBA']
  return getApprovalState(required, subtask.approvals)
}

/**
 * 리드가 요청을 승인할 수 있는지 (시나리오 3).
 * 결재가 모두 떨어져야 하고, 본인이 등록한 건은 직접 승인할 수 없다.
 */
export function getRequestApproveState(request: Request, user: User) {
  if (request.requester.id === user.id) {
    return { enabled: false, reason: '본인이 등록한 이슈는 직접 승인할 수 없어요' }
  }
  const approval = getRequestApprovalState(request)
  if (!approval.complete) {
    return { enabled: false, reason: `결재 ${approval.pending.length}건이 남아 승인할 수 없어요` }
  }
  return { enabled: true, reason: null }
}

/** 요청 제출은 등록자 본인이 한다 (시나리오 2) */
export function canSubmitRequest(request: Request, user: User) {
  return (
    (request.status === 'DRAFT' || request.status === 'REJECTED') &&
    request.requester.id === user.id
  )
}

/**
 * 이슈 내용 수정 — 제출 전(요청대기중·반려)의 등록자 본인만 (스펙 §3.4, §11.2).
 * 검토 중에는 회수해야 고칠 수 있고, 승인 이후에는 아예 잠긴다. 첨부와 같은 규칙이다.
 */
export function canEditRequest(request: Request, user: User) {
  return (
    (request.status === 'DRAFT' || request.status === 'REJECTED') &&
    request.requester.id === user.id
  )
}

/** 인수 확인은 등록자 본인만 한다 — 리드도 대행할 수 없다 (시나리오 14) */
export function canConfirmAcceptance(request: Request, user: User) {
  return request.requester.id === user.id
}

/**
 * 부모 단계 진행 버튼의 활성화 조건 — 시나리오 13·19.
 * 두 단계 모두 같은 모양(조건 + 미충족 사유)이라 한 함수로 판정한다.
 * 인수 확인(시나리오 14)은 증적 팝업이 강제하는 별도 경로(canConfirmAcceptance)를 탄다.
 */
export function getRequestAdvanceState(request: Request) {
  if (request.status === 'IN_PROGRESS') {
    if (request.subtasks.length === 0) {
      return { enabled: false, reason: '하위작업이 1건도 없어 인수테스트를 요청할 수 없어요' }
    }
    const notReady = request.subtasks.filter(
      (subtask) => subtask.status !== SUBTASK_READY_STATUS[subtask.type]
    )
    if (notReady.length > 0) {
      return {
        enabled: false,
        reason: `하위작업 ${notReady.length}건이 아직 준비되지 않았어요 (배포형은 이행대기중, 비배포형은 완료)`,
      }
    }
    return { enabled: true, reason: null }
  }

  if (request.status === 'DEPLOY_WAITING') {
    const { done, total } = getSubtaskProgress(request)
    if (done < total) {
      return { enabled: false, reason: `하위작업 ${total - done}건이 진행 중이라 완료할 수 없어요` }
    }
    return { enabled: true, reason: null }
  }

  return { enabled: false, reason: null }
}

/**
 * 하위작업 이행 게이트 — 시나리오 17.
 * 이행은 부모가 인수 확인을 마치고 이행대기중이 된 뒤에만 가능하다.
 */
export function getSubtaskDeployGate(request: Request, subtask: Subtask) {
  if (subtask.type !== 'DEPLOY' || subtask.status !== 'DEPLOY_WAITING') {
    return { blocked: false, reason: null }
  }
  if (request.status !== 'DEPLOY_WAITING') {
    return { blocked: true, reason: '이슈의 인수 확인이 끝나야 이행할 수 있어요' }
  }
  return { blocked: false, reason: null }
}
