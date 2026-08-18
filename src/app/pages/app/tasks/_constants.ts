import { SUBTASK_STATUS_META, TASK_STATUS_META } from '@/features/tasks/constants/metadata'
import type { EnumMetadata, EnumOption } from '@/shared/utils/enum'
import { toEnumOptions } from '@/shared/utils/enum'

/** URL 파서 기본값. 페이지 크기는 서버가 최대 100까지만 받는다 */
export const TASK_LIST_DEFAULT_SIZE = 20
export const TASK_LIST_MAX_SIZE = 100
export const TASK_LIST_DEFAULT_SORT = 'createdAt,desc'

/**
 * 정렬 옵션이자 곧 화이트리스트. 키가 API의 `필드,방향` 값 그대로다.
 * 화면 옵션과 URL 검증이 같은 목록을 보므로 라벨 없는 값이 칩에 남는 일이 없다.
 * 서버도 같은 필드 목록으로 막는다 — 여기를 늘리려면 `search_task_tree`도 같이 늘려야 한다.
 */
export const TASK_LIST_SORT_META = {
  'createdAt,desc': { label: '등록일 ↓', order: 10 },
  'createdAt,asc': { label: '등록일 ↑', order: 20 },
  'updatedAt,desc': { label: '수정일 ↓', order: 30 },
  'updatedAt,asc': { label: '수정일 ↑', order: 40 },
  'key,desc': { label: '작업번호 ↓', order: 50 },
  'key,asc': { label: '작업번호 ↑', order: 60 },
  'title,asc': { label: '제목 ↑', order: 70 },
  'title,desc': { label: '제목 ↓', order: 80 },
  'status,asc': { label: '상태 코드 ↑', order: 90 },
  'status,desc': { label: '상태 코드 ↓', order: 100 },
} satisfies Record<string, EnumMetadata>

/**
 * 상태 필터 옵션 — 작업 상태와 하위작업 상태를 한 목록에 담는다.
 * 두 계층이 서로 다른 enum을 쓰지만 필터는 각 행을 자기 상태와만 맞춰보므로,
 * 하위 상태를 고르면 부모는 컨텍스트로만 딸려온다.
 * '작업중'·'완료'는 양쪽에 같은 코드로 있어 한 번만 노출하고, 고르면 두 계층 모두에 걸린다.
 */
export const TASK_LIST_STATUS_OPTIONS: EnumOption[] = [
  ...toEnumOptions(TASK_STATUS_META),
  ...toEnumOptions(SUBTASK_STATUS_META),
].filter((option, index, options) => options.findIndex((it) => it.value === option.value) === index)
