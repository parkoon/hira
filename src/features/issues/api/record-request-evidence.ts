import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getRequestsQueryKeyPrefix } from '@/features/issues/api/get-requests'
import type { EvidenceContent, RequestStatus } from '@/features/issues/api/types'
import { insertEvidence } from '@/features/issues/api/writers'

export type RecordRequestEvidenceBody = {
  issueNo: string
  status: RequestStatus
  evidence: EvidenceContent
  actorName: string
}

/** 부모 증적 정정 — 덮어쓰지 않고 새 건을 쌓는다 (시나리오 15) */
export const recordRequestEvidenceService = async ({
  issueNo,
  status,
  evidence,
  actorName,
}: RecordRequestEvidenceBody) => {
  await insertEvidence({ requestIssueNo: issueNo }, status, evidence, actorName)
}

export const getRecordRequestEvidenceMutationKey = () => ['/requests', 'record-evidence'] as const

export function useRecordRequestEvidenceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getRecordRequestEvidenceMutationKey(),
    mutationFn: recordRequestEvidenceService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getRequestsQueryKeyPrefix() }),
  })
}
