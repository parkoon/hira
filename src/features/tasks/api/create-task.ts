import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

import { attachFilesService } from '@/features/tasks/api/attach-files'
import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import type { TaskDraft } from '@/features/tasks/api/types'
import { insertHistory } from '@/features/tasks/api/writers'
import { supabase } from '@/shared/lib/supabase'

export type CreateTaskBody = {
  draft: TaskDraft
  /** 등록 화면에서 고른 첨부. File은 브라우저 객체라 draft에 넣지 않고 따로 받는다 */
  files: File[]
  requesterId: string
  requesterName: string
}

/** 채번은 등록 연도 기준, 남아 있는 번호 중 최대값 다음이다 */
async function nextTaskNo() {
  const prefix = `WR-${new Date().getFullYear()}-`

  const { data, error } = await supabase
    .from('tasks')
    .select('task_no')
    .like('task_no', `${prefix}%`)
    .order('task_no', { ascending: false })
    .limit(1)
  if (error) throw error

  const lastSequence = data.length === 0 ? 0 : Number(data[0].task_no.slice(prefix.length))
  const next = Number.isNaN(lastSequence) ? 1 : lastSequence + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export type CreateTaskResult = {
  taskNo: string
  /** 작업 행 이후 단계(첨부·이력)까지 모두 저장됐는지 — 실패해도 작업 자체는 만들어져 있다 */
  complete: boolean
}

/** 등록은 임시저장까지 — 제출은 상세에서 별도로 한다 (시나리오 1·2) */
export const createTaskService = async ({
  draft,
  files,
  requesterId,
  requesterName,
}: CreateTaskBody): Promise<CreateTaskResult> => {
  const taskNo = await nextTaskNo()

  const { error } = await supabase.from('tasks').insert({
    task_no: taskNo,
    title: draft.title,
    description: draft.description,
    status: 'DRAFT',
    priority: draft.priority,
    requester_id: requesterId,
    consultant_id: draft.consultantId,
    due_date: draft.dueDate,
    created_at: format(new Date(), 'yyyy-MM-dd'),
    handles_personal_data: draft.handlesPersonalData,
    consumer_protection_target: draft.consumerProtectionTarget,
    dark_pattern_checked: draft.darkPatternChecked,
  })
  if (error) throw error

  // 작업 행이 생긴 뒤의 실패는 등록 실패로 전파하지 않는다 — 등록 실패로 보이면
  // 재등록으로 같은 작업이 중복 채번되고, 먼저 생긴 건은 목록에 안 보이는 유령으로 남는다.
  // 첨부는 상세 화면에서 다시 올릴 수 있으므로 만들어진 번호로 이동시킨다.
  try {
    // 첨부를 이력보다 먼저 저장한다 — File 객체는 모달이 닫히면 다시 얻을 수 없지만
    // 이력은 DB에서 복구할 수 있다. 상세 화면의 첨부 추가와 같은 경로라 감사 로그까지 동일하다
    await attachFilesService({ taskNo, files, actorName: requesterName })

    await insertHistory(
      { taskNo },
      { actorName: requesterName, fromStatus: null, toStatus: 'DRAFT' }
    )
  } catch {
    return { taskNo, complete: false }
  }

  return { taskNo, complete: true }
}

export const getCreateTaskMutationKey = () => ['/tasks', 'create'] as const

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: getCreateTaskMutationKey(),
    mutationFn: createTaskService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getTasksQueryKeyPrefix() }),
  })
}
