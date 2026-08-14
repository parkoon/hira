import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { EvidenceContent, TaskStatus } from '@/features/tasks/api/types'
import { insertEvidence } from '@/features/tasks/api/writers'

export type RecordTaskEvidenceBody = {
  taskNo: string
  status: TaskStatus
  evidence: EvidenceContent
  actorName: string
}

/** 부모 증적 정정 — 덮어쓰지 않고 새 건을 쌓는다 (시나리오 15) */
export const recordTaskEvidenceService = async ({
  taskNo,
  status,
  evidence,
  actorName,
}: RecordTaskEvidenceBody) => {
  await insertEvidence({ taskNo: taskNo }, status, evidence, actorName)
}

export const getRecordTaskEvidenceMutationKey = () => ['/tasks', 'record-evidence'] as const

export function useRecordTaskEvidenceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getRecordTaskEvidenceMutationKey(),
    mutationFn: recordTaskEvidenceService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
