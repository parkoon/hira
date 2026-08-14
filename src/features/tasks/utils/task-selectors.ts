import type {
  Approval,
  ApprovalKind,
  Subtask,
  SubtaskStatus,
  Task,
} from '@/features/tasks/api/types'
import { getSubtaskFlow } from '@/features/tasks/constants/transitions'
import type { User } from '@/features/users/api/types'
import { ROLE_LEVEL } from '@/features/users/constants/metadata'

/**
 * 작업 열람 권한 — 요청자는 본인이 등록한 건만 볼 수 있다 (스펙 §3.3).
 * 목록과 상세(직접 URL 접근)가 같은 규칙을 쓴다.
 */
export function canViewTask(task: Task, user: User): boolean {
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL.WORKER || task.requester.id === user.id
}

/**
 * 목록에 노출할 작업.
 * - 임시저장(요청대기중) 건은 등록자 본인에게만 노출한다 — 제출 전에는 조직의 업무
 *   대상이 아니지만, 본인에게마저 숨기면 목록으로 돌아갈 길이 없다 (스펙 §4.3 완화)
 * - 열람 권한은 `canViewTask`와 같은 규칙이다
 */
export function selectVisibleTasks(tasks: Task[], user: User): Task[] {
  return tasks.filter(
    (task) => (task.status !== 'DRAFT' || task.requester.id === user.id) && canViewTask(task, user)
  )
}

/** 승인 대기함 대상 — 리드가 결정해야 할 제출 건 */
export function selectPendingApprovalTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status === 'PENDING_APPROVAL')
}

export function selectTaskByTaskNo(tasks: Task[], taskNo: string): Task | undefined {
  return tasks.find((task) => task.taskNo === taskNo)
}

export function selectSubtaskBySubtaskNo(tasks: Task[], subtaskNo: string): Subtask | undefined {
  return tasks.flatMap((task) => task.subtasks).find((subtask) => subtask.subtaskNo === subtaskNo)
}

/** 내 하위작업 — 본인이 담당자인 하위작업. 동명이인이 있어도 안전하게 id로 식별한다 */
export function selectSubtasksByAssignee(tasks: Task[], assigneeId: string): Subtask[] {
  return tasks
    .flatMap((task) => task.subtasks)
    .filter((subtask) => subtask.assignee.id === assigneeId)
}

export function getSubtaskProgress(task: Task) {
  const total = task.subtasks.length
  const done = task.subtasks.filter((subtask) => subtask.status === 'DONE').length
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

/**
 * 요청 승인 전에 받아야 하는 결재 (시나리오 3).
 * 요건 속성에 따라 붙으므로, 둘 다 아니면 결재 없이 바로 승인할 수 있다.
 */
export function getRequiredApprovals(task: Task): ApprovalKind[] {
  const required: ApprovalKind[] = []
  if (task.handlesPersonalData) required.push('COMPLIANCE')
  if (task.consumerProtectionTarget) required.push('CONSUMER_PROTECTION')
  return required
}

function getApprovalState(required: ApprovalKind[], approvals: Approval[]) {
  const pending = required.filter((kind) => !approvals.some((approval) => approval.kind === kind))
  return { required, pending, complete: pending.length === 0 }
}

/** 요청 결재 진행 상태 — 임시 승인 버튼이 채운다 (시나리오 각주 2) */
export function getTaskApprovalState(task: Task) {
  return getApprovalState(getRequiredApprovals(task), task.approvals)
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
export function getTaskApproveState(task: Task, user: User) {
  if (task.requester.id === user.id) {
    return { enabled: false, reason: '본인이 등록한 작업은 직접 승인할 수 없어요' }
  }
  const approval = getTaskApprovalState(task)
  if (!approval.complete) {
    return { enabled: false, reason: `결재 ${approval.pending.length}건이 남아 승인할 수 없어요` }
  }
  return { enabled: true, reason: null }
}

/**
 * 요청 제출은 등록자 본인이 한다 (시나리오 2).
 * 화면 어휘는 '승인 요청'이다 — 코드·DB는 스펙 용어(submit)를 그대로 쓴다.
 */
export function canSubmitTask(task: Task, user: User) {
  return (task.status === 'DRAFT' || task.status === 'REJECTED') && task.requester.id === user.id
}

/** 작업 수정 주체 — 등록자 본인만. 주체가 아니면 화면에서 아예 감춘다 (스펙 §3.4) */
export function canEditTask(task: Task, user: User) {
  return task.requester.id === user.id
}

/**
 * 작업 내용을 지금 고칠 수 있는지 — 제출 전(요청대기중·반려)까지만 (스펙 §3.4, §11.2).
 * 주체는 맞는데 때가 아닌 경우라 감추지 않고 이유를 알려준다.
 * 첨부도 이 규칙을 함께 탄다 — 첨부 입력이 수정 모달 안에 있어 규칙이 갈라질 자리가 없다.
 */
export function getTaskEditState(task: Task) {
  if (task.status === 'PENDING_APPROVAL') {
    return { enabled: false, reason: '검토 중에는 수정할 수 없어요. 회수 후 수정하세요' }
  }
  if (task.status !== 'DRAFT' && task.status !== 'REJECTED') {
    return { enabled: false, reason: '승인 이후에는 수정할 수 없어요' }
  }
  return { enabled: true, reason: null }
}

/**
 * 하위작업 단계별 수행 주체 — 전이와 그 단계 증적 정정이 같은 규칙을 쓴다.
 * 기본은 담당자·리드(스펙 §5.3)지만, 인수 테스트중만 부모 작업의 등록자 본인이다 —
 * 요청한 사람이 요청한 대로인지 확인하는 단계라 리드도 대행할 수 없다.
 */
export function canActOnSubtaskStep(
  task: Task,
  subtask: Subtask,
  user: User,
  status: SubtaskStatus
): boolean {
  if (status === 'ACCEPTANCE') return task.requester.id === user.id
  return ROLE_LEVEL[user.role] >= ROLE_LEVEL.LEAD || subtask.assignee.id === user.id
}

/**
 * 최종 완료 버튼의 활성화 조건.
 * 인수 테스트가 배포형 하위작업의 단계로 내려가 부모가 중간에 멈춰 설 자리가 없다 —
 * 작업중에서 하위작업 전건 완료를 확인하고 바로 완료로 간다.
 */
export function getTaskAdvanceState(task: Task) {
  if (task.status !== 'IN_PROGRESS') {
    return { enabled: false, reason: null }
  }
  if (task.subtasks.length === 0) {
    return { enabled: false, reason: '하위작업이 1건도 없어 완료할 수 없어요' }
  }
  const { done, total } = getSubtaskProgress(task)
  if (done < total) {
    return { enabled: false, reason: `하위작업 ${total - done}건이 진행 중이라 완료할 수 없어요` }
  }
  return { enabled: true, reason: null }
}
