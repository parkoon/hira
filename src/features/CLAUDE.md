# src/features — 도메인별 기능

## 한 줄 정의

업무 도메인을 폴더명으로 사용하는 도메인 단위 기능 모음.

---

## 폴더 구조

```text
src/features/
└── {domain}/              # 업무 도메인 (예: tasks, users, audit-logs, gitea)
    ├── api/               # queryOptions, mutation hooks (Supabase 호출)
    │   ├── get-*.ts       # 조회
    │   ├── create-*.ts    # 쓰기 — 동작 이름으로 (transition-*, approve-*, ...)
    │   ├── writers.ts     # 여러 mutation이 공유하는 쓰기 헬퍼
    │   ├── types.ts       # 앱 레이어에 노출할 DTO 타입
    │   └── __tests__/
    ├── constants/         # 도메인 전용 상수 (enum 메타데이터 등)
    ├── components/        # 같은 도메인 내 cross-page 컴포넌트
    ├── hooks/             # 도메인 전용 커스텀 훅
    └── utils/             # 도메인 전용 순수 유틸 함수
```

현재 도메인: `tasks`, `users`, `audit-logs`, `gitea`

---

## 도메인 네이밍 기준

업무 개념 단위. 주 테이블 이름과 대체로 일치한다.

- 작업·하위작업·증적·결재 → `features/tasks/`
- 사용자·역할 → `features/users/`
- 의미상 같은 도메인이면 폴더를 쪼개지 않고 통합한다

---

## components 에스컬레이션 기준

| 사용 범위               | 위치                            |
| ----------------------- | ------------------------------- |
| 한 페이지에서만 사용    | `app/pages/{Page}/_components/` |
| 같은 도메인 여러 페이지 | `features/{domain}/components/` |
| 도메인 무관 공통        | `shared/components/`            |

"두 번째 페이지에서 필요해지는 순간"이 올리는 트리거. 미리 올리지 않는다.

---

## 의존 방향

```text
app/pages/{domain}/  →  features/{domain}/  →  shared/
```

- `features`는 `app/pages/`를 절대 import하지 않는다.
- 서로 다른 `features/{domain}` 간 직접 참조를 피한다. 필요하면 `shared/`로 올린다.

---

## constants/ — 도메인 전용 상수

도메인에 속하는 enum 메타데이터, 고정값 등을 관리한다. 화면별 하드코딩 금지.

### metadata.ts — enum 메타데이터

```ts
import type { EnumMetadata } from '@/shared/utils/enum'

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export const APPROVAL_STATUS_META = {
  PENDING: { label: '대기중', order: 10, tone: 'warning' },
  APPROVED: { label: '승인', order: 20, tone: 'success' },
  REJECTED: { label: '반려', order: 30, tone: 'danger' },
} satisfies Record<ApprovalStatus, EnumMetadata>
```

- `satisfies Record<EnumType, EnumMetadata>` 필수 — enum 값 추가/삭제 시 타입 에러로 누락 감지.
- enum 타입은 `features/{domain}/api/types.ts`의 DTO 타입(DB enum과 일치)을 그대로 쓴다.
- 값 목록이 따로 필요하면(zod enum 등) META 키에서 파생한다 (예: `PRIORITIES`). 사본 재작성 금지.
- 헬퍼 함수(`toEnumOptions`, `isKnownEnumValue`, `getEnumLabel`)는 `@/shared/utils/enum`에서 import.
- URL search param은 `as EnumType[]` cast 금지. `isKnownEnumValue`로 타입 가드한다.

---

## api/ 파일명 규칙

kebab-case. 조회는 `get-` prefix, 쓰기는 도메인 동작 이름을 그대로 쓴다.

| 종류 | 패턴               | 예시                                         |
| ---- | ------------------ | -------------------------------------------- |
| 조회 | `get-{리소스}.ts`  | `get-tasks.ts`, `get-users.ts`               |
| 쓰기 | `{동작}-{대상}.ts` | `create-task.ts`, `transition-subtask.ts`    |
| 공유 | `writers.ts`       | 증적·이력·결재처럼 여러 mutation이 쓰는 헬퍼 |

---

## api/ 타입 소스

DB row 타입은 `@/shared/types/database`의 `Database` 생성 타입(수기 편집 금지).
앱 레이어에 노출하는 DTO는 `api/types.ts`에 정의하고, 변환은 `get-*.ts`의 매퍼가 담당한다.

```ts
import type { Database } from '@/shared/types/database'

type Tables = Database['public']['Tables']
type TaskRow = Tables['tasks']['Row']
```

---

## 조회 파일 (`get-*.ts`)

선언 순서: **타입 → 매퍼 → service → queryKey prefix (목록만) → queryKey → queryOptions**

```ts
import { queryOptions } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { Database } from '@/shared/types/database'

export const getTasksService = async (): Promise<Task[]> => {
  const { data, error } = await supabase.from('tasks').select(TASK_TREE_SELECT)
  if (error) throw error
  return data.map(toTask)
}

export const getTasksQueryKeyPrefix = () => ['/tasks'] as const

export const getTasksQueryKey = () => [...getTasksQueryKeyPrefix()] as const

export const getTasksQueryOptions = () =>
  queryOptions({
    queryKey: getTasksQueryKey(),
    queryFn: getTasksService,
  })
```

### 목록 조회 (prefix 함수 필수)

뮤테이션이 현재 필터 상태 없이도 목록 전체를 무효화할 수 있게 prefix 함수를 추가한다.

```ts
export const getQueryExecutionsQueryKeyPrefix = () => ['/query/executions'] as const

export const getQueryExecutionsQueryKey = (query: GetQueryExecutionsQueryParams) =>
  [...getQueryExecutionsQueryKeyPrefix(), query] as const
```

### `enabled` 가드

파라미터가 유효할 때만 실행해야 하면 `queryOptions`에 명시한다.

```ts
queryOptions({
  queryKey: ...,
  queryFn: ...,
  enabled: schemaName.length > 0 && tableName.length > 0,
})
```

---

## 뮤테이션 파일 (`create-*.ts`, `transition-*.ts` 등)

선언 순서: **타입 → service → mutation key → hook**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasksQueryKeyPrefix } from '@/features/tasks/api/get-tasks'
import { supabase } from '@/shared/lib/supabase'

export const getCreateTaskMutationKey = () => ['/tasks', 'create'] as const
```

다단계 쓰기(상태 update + 증적 + 이력) 규칙:

- 상태를 바꾸는 update에는 `.eq('status', 기대값)` 가드를 걸고 `.select()`로 영향 행을
  확인한다 — 0건이면 낡은 화면의 요청이므로 `AppError`(한국어 문구)로 실패 처리한다.
  단, 이미 원하는 상태에 도달해 있는 멱등 경로(예: DBA 결재 중복 승인)는 조용히 성공으로 넘긴다.
- 증적은 상태 update보다 먼저 남긴다 — 전이가 실패해도 재시도가 정정으로 쌓여 유실되지 않는다.
- 시각 컬럼은 클라이언트에서 넣지 않고 DB `default now()`에 맡긴다.

### 전역 에러 토스트 (`meta.suppressGlobalError`)

`MutationCache.onError`는 기본적으로 모든 mutation 에러를 토스트로 표시한다.
호출 측에서 `mutateAsync` + `try-catch` 또는 `onError` 콜백으로 에러를 직접 처리하는
경우에만 `meta: { suppressGlobalError: true }`를 추가한다.

### mutation key 중복 방지

같은 리소스에 뮤테이션이 여러 개면 두 번째 요소로 동작을 구분한다.

```text
['/tasks', 'create']
['/tasks', 'transition']
['/subtasks', 'approve']
```

### 캐시 무효화 vs 제거

- 목록 전체 무효화: `void queryClient.invalidateQueries({ queryKey: getXxxQueryKeyPrefix() })`
- 특정 항목 무효화: `void queryClient.invalidateQueries({ queryKey: getXxxQueryKey(id) })`
- 항목 완전 제거 (로그아웃 등): `queryClient.removeQueries({ queryKey: getXxxQueryKey() })`

뮤테이션 파일은 `get-*` 파일이 export한 **key 함수만** import한다. `getXxxQueryOptions().queryKey` 형태 금지.

---

## Query Key 규칙

- 첫 요소: 경로형 문자열 — 리소스 기준, path param은 `/{param}` 템플릿 유지
- 두 번째 요소부터: 실제 param 값 또는 query params 객체
- camelCase 키 이름 금지

```text
// O
['/tasks'] as const
['/tasks/{taskNo}', taskNo] as const

// X
['tasks', 'my']
['auditLogs']
```

---

## `types.ts` — 도메인 DTO 타입

앱 레이어(`src/app/`)가 직접 참조할 의미 있는 이름의 타입만 정의한다.

```ts
export type Task = {
  taskNo: string
  status: TaskStatus
  // ...화면이 쓰는 모양 그대로
}
```

앱 레이어는 `Database['public']['Tables'][...]` row 타입을 직접 참조하지 않는다 —
snake_case row → camelCase DTO 변환은 `get-*.ts`의 매퍼가 담당한다.

---

## 컴포넌트에서 쿼리/뮤테이션 사용

### 변수명 — 구조분해 금지

결과를 변수에 담을 때 구조분해하지 않는다. 전체 객체를 변수에 할당해 `query.data`, `mutation.isPending`처럼 접근한다.

```ts
// O
const postsQuery = useSuspenseQuery(getPostsQueryOptions({ status }))
const deletePost = useDeletePostMutation()

postsQuery.data.items
deletePost.isPending

// X — 구조분해 금지
const { data } = useSuspenseQuery(getPostsQueryOptions({ status }))
const { mutate, isPending } = useDeletePostMutation()
```

이유: 변수명만 봐도 query인지 mutation인지, 어떤 리소스인지 즉시 파악된다. 구조분해는 `data`가 어디서 온 것인지 추적을 어렵게 만든다.

### queryOptions spread

`queryOptions`를 `useSuspenseQuery`에 spread. 옵션 인라인 재구성 금지.

```ts
// O
const postsQuery = useSuspenseQuery(getPostsQueryOptions({ status }))

// X
const postsQuery = useSuspenseQuery({
  queryKey: getPostsQueryKey({ status }),
  queryFn: () => getPostsService({ status }),
})
```

---

## 테스트

- 위치: `src/features/{domain}/{constants,utils}/__tests__/`
- 테스트 이름/설명: **한글**
- 상태 머신·셀렉터 같은 순수 로직을 입력→출력 기준으로 검증한다.
  상수 정의를 그대로 재진술하는 동어반복 테스트는 쓰지 않는다.
- endpoint 나열이 아니라 **사용 흐름** 중심으로 작성
