import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { EvidenceContent, SubtaskStatus } from '@/features/tasks/api/types'
import { insertEvidence } from '@/features/tasks/api/writers'

export type RecordEvidenceBody = {
  subtaskNo: string
  status: SubtaskStatus
  evidence: EvidenceContent
  actorName: string
}

/** 기록된 증적 정정 — 덮어쓰지 않고 새 건을 쌓아 이력을 남긴다 (시나리오 각주 3) */
export const recordEvidenceService = async ({
  subtaskNo,
  status,
  evidence,
  actorName,
}: RecordEvidenceBody) => {
  await insertEvidence({ subtaskNo: subtaskNo }, status, evidence, actorName)
}

export const getRecordEvidenceMutationKey = () => ['/subtasks', 'record-evidence'] as const

export function useRecordEvidenceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getRecordEvidenceMutationKey(),
    mutationFn: recordEvidenceService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
