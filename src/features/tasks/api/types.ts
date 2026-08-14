/**
 * 앱 레이어가 쓰는 도메인 DTO 타입.
 * DB enum·row와의 정합성은 `@/shared/types/database`(Supabase 생성 타입)가 기준이고,
 * snake_case row → 이 모양으로의 변환은 `get-tasks.ts` 매퍼가 담당한다.
 */

/**
 * 작업(부모) 상태.
 * 부모는 하위작업의 집계다 — 인수 테스트가 배포형 하위작업의 단계로 내려가면서
 * 부모가 중간에 멈춰 설 자리가 없어졌고, 작업중에서 하위작업 전건 완료 후 바로 완료로 간다.
 */
export type TaskStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'IN_PROGRESS' | 'DONE' | 'REJECTED'

/** 하위작업 유형 — 워크플로를 결정한다 (스펙 §5.2) */
export type SubtaskType = 'DEPLOY' | 'NON_DEPLOY'

/**
 * 하위작업(자식) 상태.
 * 배포형과 비배포형(4단계)이 서로 다른 상태 집합을 쓴다.
 * 배포형은 DBA 검증 여부에 따라 9·10단계로 갈리므로, 순서는 유형이 아니라
 * 하위작업 단위로 정해진다 — `constants/transitions.ts`의 `getSubtaskFlow` 참조.
 * 인수 테스트중은 배포형 전용이며, 이 단계만 전이 주체가 부모 작업의 등록자다.
 */
export type SubtaskStatus =
  | 'TODO'
  | 'ANALYSIS'
  | 'DEVELOPMENT'
  | 'DBA_VERIFICATION'
  | 'THIRD_PARTY'
  | 'FUNCTIONAL_TEST'
  | 'ACCEPTANCE'
  | 'DEPLOY_WAITING'
  | 'POST_DEPLOY_CHECK'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'DONE'

/**
 * 단계 완료 시 남기는 증적 (시나리오 각주 3).
 * 단계마다 받는 항목이 다르지 않다 — 어느 단계든 링크·첨부파일·메모 세 가지로 남긴다.
 * 단계별 차이는 안내 문구와 필수 항목뿐이며 `constants/transition-evidence.ts`가 갖는다.
 */
export type EvidenceContent = {
  links: ReferenceLink[]
  /** 증적 첨부는 개별로 떼는 경로가 없어 id를 들고 다니지 않는다 */
  attachments: AttachmentDraft[]
  memo: string
}

/**
 * 같은 `status`가 여러 건이면 마지막 건이 유효하고 앞선 건은 정정 이력으로 남는다.
 */
export type TransitionEvidence = EvidenceContent & {
  /** 어느 단계를 끝내며 남긴 증적인지 — 전이 직전 상태 */
  status: SubtaskStatus
  recordedBy: string
  recordedAt: string
}

/**
 * 결재 종류 (시나리오 3·9).
 * 컴플라이언스·소비자보호는 요청 승인 전에, DBA는 DBA 검증중에 받는다.
 */
export type ApprovalKind = 'COMPLIANCE' | 'CONSUMER_PROTECTION' | 'DBA'

/**
 * 결재 기록 — 실제 결재선 연동 전 임시 모델 (시나리오 각주 2).
 * 필요한 결재 종류는 작업 속성에서 파생하고(`getRequiredApprovals`), 여기엔 떨어진 건만 쌓인다.
 * 임시 승인 버튼이 이 배열에 한 건을 넣는 것이 곧 "결재 OK"다.
 */
export type Approval = {
  kind: ApprovalKind
  approvedBy: string
  approvedAt: string
}

export type Priority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'

export type TaskActor = {
  /** profiles.id — 본인 판정·담당자 필터는 이름이 아니라 id로 한다 (동명이인 안전) */
  id: string
  name: string
  dept: string
}

/** 화면에서 막 고른 첨부 — 아직 저장 전이라 id가 없다 */
export type AttachmentDraft = {
  fileName: string
  size: number
}

/** 저장된 첨부. id로 지목해 뗄 수 있다 (같은 이름이 여러 번 붙을 수 있다) */
export type Attachment = AttachmentDraft & {
  id: number
}

export type ReferenceLink = {
  url: string
}

export type StatusHistoryEntry = {
  id: number
  occurredAt: string
  actorName: string
  fromStatus: string | null
  toStatus: string
  via: 'MANUAL' | 'API'
  reason: string | null
}

/** 하위작업에서 만든 Gitea 브랜치 — 하위작업과 1:1이다 (개발 패널이 링크로 보여준다) */
export type SubtaskBranch = {
  repoFullName: string
  branchName: string
  branchUrl: string
}

export type Subtask = {
  subtaskNo: string
  parentTaskNo: string
  type: SubtaskType
  title: string
  description: string
  status: SubtaskStatus
  assignee: TaskActor
  dueDate: string | null
  completedAt: string | null
  /**
   * DBA에게 검증받을 내용 — 개발 완료 시점에 체크하면 입력받는다 (시나리오 8).
   * `null`이면 DBA 검증을 거치지 않으며, 워크플로에서 DBA 검증중 단계가 빠진다.
   * 체크 여부와 내용을 한 필드로 묶어 "체크했는데 내용이 없는" 상태를 만들지 않는다.
   */
  dbaVerificationRequest: string | null
  /** DBA 검증 결재 (시나리오 9). 결재선 연동 전까지는 임시 버튼으로 채운다 */
  approvals: Approval[]
  /** 단계 완료 시 남긴 증적 (시나리오 각주 3) */
  evidences: TransitionEvidence[]
  history: StatusHistoryEntry[]
  branch: SubtaskBranch | null
}

/** 작업 등록 폼이 채우는 값 — 저장 시점에는 항상 요청대기중이다 (시나리오 1) */
export type TaskDraft = {
  title: string
  description: string
  priority: Priority
  dueDate: string
  /** 사전협의자 profiles.id — 폼에서 필수라 항상 채워진다 */
  consultantId: string
  handlesPersonalData: boolean
  consumerProtectionTarget: boolean
  darkPatternChecked: boolean
}

export type SubtaskDraft = {
  type: SubtaskType
  title: string
  description: string
  assignee: TaskActor
  dueDate: string | null
}

export type Task = {
  taskNo: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  requester: TaskActor & { contact: string }
  /**
   * 등록 전에 협의한 상대 (등록 폼 필수).
   * 이 필드가 생기기 전에 등록된 건은 `null`이다 — 없는 값을 지어내지 않는다.
   */
  consultant: TaskActor | null
  dueDate: string
  createdAt: string
  submittedAt: string | null
  /** 개인정보 취급 여부 — '예'면 컴플라이언스 결재가 붙는다 (시나리오 3) */
  handlesPersonalData: boolean
  /** 소비자보호 승인 대상 여부 — '예'면 소비자보호 결재가 붙는다 (시나리오 3) */
  consumerProtectionTarget: boolean
  darkPatternChecked: boolean
  attachments: Attachment[]
  subtasks: Subtask[]
  /** 요청 승인 전 받아야 하는 결재 (시나리오 3). 결재선 연동 전까지는 임시 버튼으로 채운다 */
  approvals: Approval[]
  history: StatusHistoryEntry[]
}
