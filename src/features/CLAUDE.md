# src/features — 도메인별 기능

## 한 줄 정의

API 첫 path segment를 폴더명으로 사용하는 도메인 단위 기능 모음.

---

## 폴더 구조

```text
src/features/
└── {domain}/              # API path 첫 segment (예: approvals, query, snippets)
    ├── api/               # queryOptions, mutation hooks
    │   ├── get-*.ts
    │   ├── post-*.ts
    │   ├── put-*.ts
    │   ├── patch-*.ts
    │   ├── delete-*.ts
    │   ├── types.ts       # 앱 레이어에 노출할 DTO 타입
    │   └── __tests__/
    ├── constants/         # 도메인 전용 상수 (enum 메타데이터 등)
    ├── components/        # 같은 도메인 내 cross-page 컴포넌트
    ├── hooks/             # 도메인 전용 커스텀 훅
    └── utils/             # 도메인 전용 순수 유틸 함수
```

현재 도메인: `members`, `posts` (예시)

---

## 도메인 네이밍 기준

API path의 첫 번째 segment. `/api/v1/{domain}/...`에서 `{domain}` 부분.

- `/api/v1/approvals/...` → `features/approvals/`
- `/api/v1/snippets/...` → `features/snippets/`
- `/api/v1/approval-delegations/...` → 의미상 같은 도메인이면 `features/approvals/`로 통합

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
- enum 타입은 `@/shared/types/api`의 OpenAPI 타입을 그대로 쓴다. 수기 작성 금지.
- 헬퍼 함수(`toEnumOptions`, `isKnownEnumValue`, `getEnumLabel`)는 `@/shared/utils/enum`에서 import.
- URL search param은 `as EnumType[]` cast 금지. `isKnownEnumValue`로 타입 가드한다.

---

## api/ 파일명 규칙

HTTP 메서드 prefix + kebab-case 리소스명. `/api/v1` 제외, 경로 세그먼트 기준.

| 메서드 | 패턴                 | 예시                      |
| ------ | -------------------- | ------------------------- |
| GET    | `get-{리소스}.ts`    | `get-query-executions.ts` |
| POST   | `post-{리소스}.ts`   | `post-query-execute.ts`   |
| PUT    | `put-{리소스}.ts`    | `put-approvals-amend.ts`  |
| PATCH  | `patch-{리소스}.ts`  | `patch-snippet-file.ts`   |
| DELETE | `delete-{리소스}.ts` | `delete-snippet-file.ts`  |

---

## api/ 타입 소스

`@/shared/types/api`의 `paths`, `components` (OpenAPI 자동 생성). 직접 타입 수기 작성 금지.

```ts
import type { InferPathParams, InferQueryParams, InferBody, InferResponse } from '@/shared/lib/api'
import type { paths } from '@/shared/types/api'
```

---

## 조회 파일 (`get-*.ts`)

선언 순서: **타입 → service → queryKey prefix (목록만) → queryKey → queryOptions**

### 단건 조회

```ts
import { queryOptions } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api/api-client'
import type { InferPathParams, InferResponse } from '@/shared/lib/api'
import type { paths } from '@/shared/types/api'

export type GetApprovalsDetailPathParams = InferPathParams<paths, '/api/v1/approvals/{id}', 'get'>
export type GetApprovalsDetailResponse = InferResponse<paths, '/api/v1/approvals/{id}', 'get'>

export const getApprovalsDetailService = ({ id }: GetApprovalsDetailPathParams) =>
  apiClient.GET('/api/v1/approvals/{id}', { path: { id } }).then((res) => res.data)

export const getApprovalsDetailQueryKey = (id: GetApprovalsDetailPathParams['id']) =>
  ['/approvals/{id}', id] as const

export const getApprovalsDetailQueryOptions = (id: GetApprovalsDetailPathParams['id']) =>
  queryOptions({
    queryKey: getApprovalsDetailQueryKey(id),
    queryFn: () => getApprovalsDetailService({ id }),
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

## 뮤테이션 파일 (`post-*.ts`, `put-*.ts`, `patch-*.ts`, `delete-*.ts`)

선언 순서: **타입 → service → mutation key → hook**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/lib/api/api-client'
import type { InferBody } from '@/shared/lib/api'
import type { MutationConfig } from '@/shared/lib/react-query'
import type { paths } from '@/shared/types/api'

export const getPostQueryExecuteMutationKey = () => ['/query/execute', 'post'] as const
```

### 전역 에러 토스트 (`meta.suppressGlobalError`)

`MutationCache.onError`는 기본적으로 모든 mutation 에러를 토스트로 표시한다.
호출 측에서 `mutateAsync` + `try-catch` 또는 `onError` 콜백으로 에러를 직접 처리하는
경우에만 `meta: { suppressGlobalError: true }`를 추가한다.

### mutation key 중복 방지

같은 경로에 뮤테이션이 여러 개면 두 번째 요소로 HTTP 메서드를 구분한다.

```text
['/approvals', 'post']
['/approvals/{id}/amend', 'put']
['/approvals/{id}/approve', 'post']
```

### 캐시 무효화 vs 제거

- 목록 전체 무효화: `void queryClient.invalidateQueries({ queryKey: getXxxQueryKeyPrefix() })`
- 특정 항목 무효화: `void queryClient.invalidateQueries({ queryKey: getXxxQueryKey(id) })`
- 항목 완전 제거 (로그아웃 등): `queryClient.removeQueries({ queryKey: getXxxQueryKey() })`

뮤테이션 파일은 `get-*` 파일이 export한 **key 함수만** import한다. `getXxxQueryOptions().queryKey` 형태 금지.

---

## Query Key 규칙

- 첫 요소: 경로형 문자열 — `/api/v1` prefix 제외, path param은 `/{param}` 템플릿 유지
- 두 번째 요소부터: 실제 param 값 또는 query params 객체
- camelCase 키 이름 금지

```text
// O
['/approvals/my'] as const
['/approvals/{id}', id] as const
['/query/executions', query] as const

// X
['approvals', 'my']
['queryExecutions']
```

---

## `types.ts` — 도메인 DTO 타입

앱 레이어(`src/app/`)가 직접 참조할 의미 있는 이름의 타입만 정의한다.

```ts
import type { components } from '@/shared/types/api'

export type SnippetFolderItem = components['schemas']['SnippetFolderItem']
```

앱 레이어는 `components['schemas']['...']`를 직접 참조하지 않는다.

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

- 위치: `src/features/{domain}/api/__tests__/`
- 테스트 이름/설명: **한글**
- MSW(`msw/node`)로 HTTP 모킹. `setupServer`의 `onUnhandledRequest: 'error'` 설정 필수.
- endpoint 나열이 아니라 **사용 흐름** 중심으로 작성
