import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { TaskActor } from '@/features/tasks/api/types'
import { insertHistory } from '@/features/tasks/api/writers'
import { AppError } from '@/shared/lib/app-error'
import { recordAuditLog } from '@/shared/lib/audit-log'
import { supabase } from '@/shared/lib/supabase'

/**
 * 수정 모달이 고칠 수 있는 항목. 넘긴 필드만 바뀐다.
 * 유형은 워크플로를 결정하므로 생성 후 바꿀 수 없다 (스펙 §5.1).
 */
export type SubtaskPatch = {
  title?: string
  description?: string
  assignee?: TaskActor
  dueDate?: string | null
}

export type UpdateSubtaskBody = {
  subtaskNo: string
  patch: SubtaskPatch
  actorName: string
}

/** 바뀐 값이 있으면 true — 호출 측이 성공 토스트를 띄울지 판단한다 */
export const updateSubtaskService = async ({
  subtaskNo,
  patch,
  actorName,
}: UpdateSubtaskBody): Promise<boolean> => {
  const { data: current, error: readError } = await supabase
    .from('subtasks')
    .select(
      `status, parent_task_no, title, description, due_date, assignee_id,
       assignee:profiles!subtasks_assignee_id_fkey(name)`
    )
    .eq('subtask_no', subtaskNo)
    .single()
  if (readError) throw readError

  const changes: string[] = []
  if (patch.title !== undefined && patch.title !== current.title) {
    changes.push(`제목 ${current.title} → ${patch.title}`)
  }
  if (patch.description !== undefined && patch.description !== current.description) {
    // 설명은 리치텍스트 HTML이라 앞뒤 값을 그대로 남기면 이력이 읽히지 않는다
    changes.push('설명 변경')
  }
  if (patch.assignee !== undefined && patch.assignee.id !== current.assignee_id) {
    changes.push(`작업자 ${current.assignee?.name ?? '없음'} → ${patch.assignee.name}`)
  }
  if (patch.dueDate !== undefined && patch.dueDate !== current.due_date) {
    changes.push(`목표일 ${current.due_date ?? '없음'} → ${patch.dueDate ?? '없음'}`)
  }
  // 값을 그대로 두고 저장한 경우 — 이력만 쌓이므로 아무것도 하지 않는다
  if (changes.length === 0) return false

  const { data: updated, error } = await supabase
    .from('subtasks')
    .update({
      ...(patch.title === undefined ? {} : { title: patch.title }),
      ...(patch.description === undefined ? {} : { description: patch.description }),
      ...(patch.assignee === undefined ? {} : { assignee_id: patch.assignee.id }),
      ...(patch.dueDate === undefined ? {} : { due_date: patch.dueDate }),
    })
    .eq('subtask_no', subtaskNo)
    // 완료된 하위작업은 기록이 확정된 것으로 본다. 화면에서도 막지만,
    // 편집 도중 완료로 넘어간 낡은 화면의 저장은 여기서 끊는다
    .neq('status', 'DONE')
    .select('subtask_no')
  if (error) throw error
  if (updated.length === 0) {
    throw new AppError('완료된 하위작업은 수정할 수 없습니다. 화면을 새로고침해 주세요.')
  }

  const summary = changes.join(' · ')

  // 상태는 그대로 두고 수정 내용만 남긴다 (부모가 하위작업 생성을 남기는 방식과 같다)
  await insertHistory(
    { subtaskNo: subtaskNo },
    { actorName, fromStatus: current.status, toStatus: current.status, reason: summary }
  )

  await recordAuditLog({
    actorName,
    eventType: 'SUBTASK_UPDATE',
    targetLabel: subtaskNo,
    // 대상 링크는 상위 작업으로 건다 — 하위작업 상세는 부모 번호가 있어야 열린다
    targetTaskNo: current.parent_task_no,
    detail: summary,
  })

  return true
}

export const getUpdateSubtaskMutationKey = () => ['/subtasks', 'update'] as const

export function useUpdateSubtaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getUpdateSubtaskMutationKey(),
    mutationFn: updateSubtaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
