import type { EvidenceContent, RequestStatus, SubtaskStatus } from '@/features/issues/api/types'

/**
 * 단계별 증적 안내 문구 (시나리오 각주 3).
 *
 * 받는 항목은 어느 단계든 링크·첨부파일·메모로 같고, 단계마다 다른 것은 문구뿐이다.
 * 여기 없는 상태는 증적 없이 확인 팝업만 거쳐 전이한다 — 작업 시작은 남길 근거가 없고,
 * DBA 검증중은 결재가 떨어지면 자동으로 넘어간다.
 */
export const EVIDENCE_HINT: Partial<Record<SubtaskStatus, string>> = {
  ANALYSIS: '설계 산출물 링크나 문서를 남겨 주세요.',
  DEVELOPMENT: '변경사항(MR·커밋) 링크를 남겨 주세요.',
  THIRD_PARTY: '제3자 검증 결과서를 남겨 주세요.',
  FUNCTIONAL_TEST: '기능 테스트 결과를 남겨 주세요.',
  DEPLOY_WAITING: '배포 완료 URL과 릴리스 정보를 남겨 주세요.',
  POST_DEPLOY_CHECK: '이행 후 점검 결과를 남겨 주세요.',
  IN_PROGRESS: '작업 산출물 링크나 문서를 남겨 주세요.',
  REVIEW: '검토 결과를 남겨 주세요.',
}

/** 부모 단계 증적 (시나리오 15) */
export const REQUEST_EVIDENCE_HINT: Partial<Record<RequestStatus, string>> = {
  ACCEPTANCE: '확인한 화면이나 테스트 결과를 남겨 주세요.',
}

/**
 * 증적은 링크·첨부파일·메모 중 최소 한 가지가 있어야 한다.
 * 무엇으로 남길지는 단계가 아니라 담당자가 고른다.
 */
export function hasEvidenceContent(evidence: EvidenceContent) {
  return (
    evidence.links.some((link) => link.url.trim().length > 0) ||
    evidence.attachments.length > 0 ||
    evidence.memo.trim().length > 0
  )
}
