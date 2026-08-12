import type { Subtask, SubtaskStatus, SubtaskType } from '@/features/issues/api/types'

/** 배포형 기본 흐름 — DBA 검증을 거치지 않는 경우 (시나리오 6~18) */
const DEPLOY_FLOW: SubtaskStatus[] = [
  'TODO',
  'ANALYSIS',
  'DEVELOPMENT',
  'THIRD_PARTY',
  'FUNCTIONAL_TEST',
  'DEPLOY_WAITING',
  'POST_DEPLOY_CHECK',
  'DONE',
]

/** 배포형 + DBA 검증 — 개발 완료 시 체크하면 개발중 다음에 한 단계가 끼어든다 (시나리오 8·9) */
const DEPLOY_FLOW_WITH_DBA: SubtaskStatus[] = [
  'TODO',
  'ANALYSIS',
  'DEVELOPMENT',
  'DBA_VERIFICATION',
  'THIRD_PARTY',
  'FUNCTIONAL_TEST',
  'DEPLOY_WAITING',
  'POST_DEPLOY_CHECK',
  'DONE',
]

const NON_DEPLOY_FLOW: SubtaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']

/**
 * 하위작업의 실제 단계 순서 — 배열 순서가 곧 스테퍼 단계 순서다.
 * 배포형은 DBA 검증 여부에 따라 8·9단계로 갈리므로 유형만으로는 정해지지 않는다.
 */
export function getSubtaskFlow(subtask: Subtask): SubtaskStatus[] {
  if (subtask.type === 'NON_DEPLOY') return NON_DEPLOY_FLOW
  return subtask.dbaVerificationRequest === null ? DEPLOY_FLOW : DEPLOY_FLOW_WITH_DBA
}

/**
 * 부모가 인수테스트로 넘어가기 위해 하위작업이 도달해야 하는 상태 (시나리오 13).
 * 부모는 하위작업 구성과 무관하게 같은 흐름을 갖고, "준비됨"의 기준만 유형별로 다르다.
 */
export const SUBTASK_READY_STATUS: Record<SubtaskType, SubtaskStatus> = {
  DEPLOY: 'DEPLOY_WAITING',
  NON_DEPLOY: 'DONE',
}

/** 플로우에서의 현재 단계 번호(1부터)와 전체 단계 수 */
export function getSubtaskStep(subtask: Subtask) {
  const flow = getSubtaskFlow(subtask)
  return { step: flow.indexOf(subtask.status) + 1, total: flow.length }
}

/** 순차 전진만 허용 — 한 단계씩만 앞으로 이동 (시나리오 6~18) */
export function getNextSubtaskStatus(subtask: Subtask): SubtaskStatus | null {
  const flow = getSubtaskFlow(subtask)
  const index = flow.indexOf(subtask.status)
  return flow[index + 1] ?? null
}

/**
 * 개발 완료 시 갈리는 분기 (시나리오 8).
 * DBA 검증 여부는 이 전이 시점에 확정되므로, 전이 전 플로우로는 다음 단계를 알 수 없다.
 */
export function getPostDevelopmentStatus(dbaVerificationRequest: string | null): SubtaskStatus {
  return dbaVerificationRequest === null ? 'THIRD_PARTY' : 'DBA_VERIFICATION'
}
