import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import type { TaskTreeResult } from '@/features/tasks/api/types'
import { supabase } from '@/shared/lib/supabase'

/**
 * 정규화가 끝난 조회 파라미터. URL 파싱·검증은 화면이 맡고 여기엔 검증된 값만 들어온다.
 * 이 객체가 그대로 queryKey의 구성 요소라 필드 순서·모양을 항상 같게 유지한다.
 */
export type TaskTreeQuery = {
  /** 1-base. **상위 작업** 기준이다 — 페이지당 실제 행 수는 하위 수만큼 늘어난다 */
  page: number
  size: number
  q: string
  /** 작업 상태와 하위작업 상태가 한 배열에 섞여 들어온다. 각 행은 자기 상태와만 맞춰본다 */
  status: string[]
  assigneeId: string | null
  /** `필드,방향` — 상위 간 정렬과 그룹 내 정렬에 같은 기준이 적용된다 */
  sort: string
}

export const getTaskTreeService = async (query: TaskTreeQuery): Promise<TaskTreeResult> => {
  const { data, error } = await supabase.rpc('search_task_tree', {
    p_page: query.page,
    p_size: query.size,
    p_q: query.q,
    p_status: query.status,
    // 생성 타입이 uuid를 optional string으로 잡아 null 대신 미전달로 기본값에 맡긴다
    p_assignee_id: query.assigneeId ?? undefined,
    p_sort: query.sort,
  })

  if (error) throw error

  // 반환이 jsonb라 생성 타입은 Json까지만 좁혀진다. 모양은 search_task_tree가 보장한다.
  return data as unknown as TaskTreeResult
}

export const getTaskTreeQueryKeyPrefix = () => ['/tasks/tree'] as const

export const getTaskTreeQueryKey = (query: TaskTreeQuery) =>
  [...getTaskTreeQueryKeyPrefix(), query] as const

export const getTaskTreeQueryOptions = (query: TaskTreeQuery) =>
  queryOptions({
    queryKey: getTaskTreeQueryKey(query),
    queryFn: () => getTaskTreeService(query),
    // 페이지·필터를 바꾸는 동안 직전 페이지를 남겨둔다 — 그리드가 빈 채로 깜빡이지 않는다
    placeholderData: keepPreviousData,
    // 상태가 자주 바뀌는 목록이라 전역 기본(1분)보다 짧게 잡는다
    staleTime: 30_000,
    // 이 화면은 에러를 그리드 자리에 인라인으로 띄우고 재시도 버튼을 준다.
    // 전역 기본은 ErrorBoundary 전파(throwOnError: true)라 여기서만 되돌린다.
    throwOnError: false,
  })
