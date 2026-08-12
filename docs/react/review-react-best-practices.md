# React Best Practices 리뷰 결과

> 2026-04-24 기준, Vercel React Best Practices + "You Might Not Need an Effect" 관점 프로젝트 전체 리뷰

---

## 목차

1. [번들 사이즈 (CRITICAL)](#1-번들-사이즈-critical)
2. [Request Waterfall (HIGH)](#2-request-waterfall-high)
3. [불필요한 useEffect (HIGH)](#3-불필요한-useeffect-high)
4. [Re-render 최적화 (MEDIUM)](#4-re-render-최적화-medium)
5. [추가 번들 최적화 (MEDIUM)](#5-추가-번들-최적화-medium)
6. [종합 평가](#6-종합-평가)

---

## 1. 번들 사이즈 (CRITICAL)

### 1-1. recharts 전체 라이브러리 namespace import (dead code)

**파일:** `src/components/ui/chart.tsx:5`

```tsx
// 현재 코드
import * as RechartsPrimitive from 'recharts'
```

- `chart.tsx`는 프로젝트 어디에서도 import되지 않는 **dead code**
- recharts는 ~300KB+이므로 tree-shaking이 실패하면 번들에 포함됨
- `import *` (namespace import)는 tree-shaking을 방해할 수 있음

**권장:** `chart.tsx` 파일 삭제. 향후 필요하면 named import으로 재작성

---

### 1-2. SqlViewDrawer가 Monaco 에디터를 정적 import

**파일:** `src/app/pages/app/sql/executions/_components/execution-table-query-executions.tsx:27`

```tsx
// 현재 코드 — SqlViewDrawer가 정적 import됨
import { SqlViewDrawer } from './sql-view-drawer'
```

- `SqlViewDrawer`는 사용자가 SQL 보기 버튼을 클릭해야만 열리는 드로어
- 하지만 Monaco (~2MB)가 executions 페이지 chunk에 무조건 포함됨

**권장:** `React.lazy()`로 동적 import

```tsx
// 개선
const SqlViewDrawer = React.lazy(() =>
  import('./sql-view-drawer').then((m) => ({ default: m.SqlViewDrawer }))
)
```

---

## 2. Request Waterfall (HIGH)

### 2-1. 스니펫 사이드바 — 폴더와 루트 파일이 순차 로딩

**파일:** `src/app/pages/app/sql/editor/_components/snippets/sql-snippet-sidebar.tsx:47-51`

```tsx
// 현재 코드 — 별도 Suspense 경계로 순차 실행
<Suspensor pending={<></>}>
  <SqlSnippetFolders />       {/* fetch 1: 폴더 목록 */}
</Suspensor>
<Suspensor pending={<></>}>
  <SqlSnippetRootFiles />     {/* fetch 2: 폴더가 완료되어야 시작 */}
</Suspensor>
```

- 두 API는 독립적이지만, 별도 Suspense 경계 때문에 **직렬 실행**됨

**권장:** 하나의 `<Suspensor>`로 감싸거나 `useSuspenseQueries`로 병렬 fetch

```tsx
// 방법 1: 하나의 Suspense 경계로 합침
;<Suspensor pending={<></>}>
  <SqlSnippetFolders />
  <SqlSnippetRootFiles />
</Suspensor>

// 방법 2: useSuspenseQueries로 병렬 fetch
const [folders, rootFiles] = useSuspenseQueries({
  queries: [getSnippetFoldersQueryOptions(), getSnippetRootFilesQueryOptions()],
})
```

---

### 2-2. 테이블 데이터 페이지 — Suspense 경계 누락

**파일:** `src/app/pages/app/database/tables/data/page.tsx:19-22`

```tsx
// 현재 코드 — QuerySuspensor 없음
<DatabaseTableDataTable
  schema={schema}
  tableId={tableId}
/>
```

- `DatabaseTableDataTable` 내부에서 `useSuspenseQuery`를 사용하지만 `<QuerySuspensor>`로 감싸지 않음
- 로딩 시 앱 전체 스피너가 표시됨 (의도치 않은 UX)
- 같은 폴더의 `columns/page.tsx`는 올바르게 `<QuerySuspensor pending={<TableSkeleton />}>`을 사용

**권장:**

```tsx
<QuerySuspensor pending={<TableSkeleton />}>
  <DatabaseTableDataTable
    schema={schema}
    tableId={tableId}
  />
</QuerySuspensor>
```

---

### 2-3. 권한 요청 페이지 — 같은 쿼리가 이중 Suspense

**파일:** `src/app/pages/app/permissions/requests/page.tsx:39-44`

```tsx
// 현재 코드 — 같은 쿼리 키인데 별도 Suspense
<QuerySuspensor pending={<FilterTabsSkeleton />}>
  <PermissionFilterTabs />        {/* useSuspenseQuery(getPermissionsRequestsQueryOptions()) */}
</QuerySuspensor>

<QuerySuspensor pending={<PermissionRequestsTableSkeleton />}>
  <PermissionRequestsTable />     {/* useSuspenseQuery(getPermissionsRequestsQueryOptions()) — 동일 쿼리 키 */}
</QuerySuspensor>
```

- React Query가 캐시로 중복 요청을 제거하지만, 두 컴포넌트가 순차적으로 suspend되어 **스켈레톤이 두 번 깜빡임**

**권장:** 하나의 `<QuerySuspensor>`로 합치기

---

## 3. 불필요한 useEffect (HIGH)

> 참고: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

### 3-1. auth-loader.tsx — 쿼리 데이터를 Effect로 스토어에 동기화

**파일:** `src/lib/auth/auth-loader.tsx:26-28`

```tsx
// 현재 코드
const { data } = useSuspenseQuery(getAuthMeQueryOptions())

useEffect(() => {
  setUser(data)
}, [data, setUser])

if (!user) return null // 첫 렌더에서 data가 있는데도 null 반환!
```

**문제:**

- Suspense가 `data`를 보장하지만, `useEffect`는 첫 렌더 이후에 실행됨
- 따라서 첫 프레임에서 `user`가 null → `children`이 렌더되지 않는 **깜빡임 발생**

**권장:** 렌더 중 동기화하거나, 스토어 미러링 자체를 제거

```tsx
// 방법 1: 렌더 중 동기화
export function AuthLoader({ children }: AuthLoaderProps) {
  const setUser = useAuthStore((s) => s.setUser)
  const { data } = useSuspenseQuery(getAuthMeQueryOptions())

  // 렌더 중에 안전하게 동기화 (idempotent)
  if (useAuthStore.getState().user !== data) {
    setUser(data)
  }

  return <>{children}</>
}

// 방법 2 (이상적): 스토어 미러링을 제거하고 쿼리 데이터를 직접 사용
```

---

### 3-2. query-execution-result-table.tsx — 불필요한 URL 정규화 Effect

**파일:** `src/app/pages/app/sql/executions/detail/_components/query-execution-result-table.tsx:37-56`

```tsx
// 현재 코드 — searchParams에서 파생 → 다시 searchParams에 쓰는 순환 구조
useEffect(() => {
  if (searchParams.get(QUERY_RESULT_PAGE_QUERY_KEY) === null && currentPage === 1) {
    return
  }
  setSearchParams(
    (prev) => {
      const next = new URLSearchParams(prev)
      if (currentPage === 1) {
        next.delete(QUERY_RESULT_PAGE_QUERY_KEY)
      } else {
        next.set(QUERY_RESULT_PAGE_QUERY_KEY, String(currentPage))
      }
      return next
    },
    { replace: true }
  )
}, [currentPage, searchParams, setSearchParams])
```

**문제:**

- `currentPage`는 `searchParams`에서 파생됨 → 다시 `searchParams`에 쓰는 **순환 의존성**
- 같은 정규화 로직이 `onPageChange` 핸들러(77-92행)에 이미 존재

**권장:** 이 Effect 삭제. `onPageChange` 핸들러가 이미 처리하고 있음

---

### 3-3. sql-editor.tsx — ref 동기화 Effect 4개

**파일:** `src/lib/sql-editor/sql-editor.tsx:36-50`

```tsx
// 현재 코드 — 4개의 동일 패턴
useEffect(() => {
  onRunRef.current = onRun
}, [onRun])
useEffect(() => {
  onRunSelectionRef.current = onRunSelection
}, [onRunSelection])
useEffect(() => {
  completionProviderRef.current = completionProvider
}, [completionProvider])
useEffect(() => {
  schemaRef.current = schema
}, [schema])
```

**문제:** Effect는 렌더 후 실행되므로 1프레임 동안 stale 값을 참조할 수 있음

**권장:** 렌더 중 직접 할당 (ref 할당은 side effect가 아님)

```tsx
// 개선 — Effect 4개 삭제
onRunRef.current = onRun
onRunSelectionRef.current = onRunSelection
completionProviderRef.current = completionProvider
schemaRef.current = schema
```

---

### 3-4. extend-permission-drawer.tsx — props 변경 시 폼 리셋

**파일:** `src/app/pages/app/permissions/my/_components/extend-permission-drawer.tsx:58-70`

```tsx
// 현재 코드
useEffect(() => {
  if (permission) {
    const currentEndDate = parseISO(permission.endDate)
    const nextStart = addDays(currentEndDate, 1)
    const nextEnd = addDays(nextStart, maxDays)
    form.reset({
      reason: '',
      startDate: nextStart,
      endDate: nextEnd,
    })
  }
}, [permission, maxDays, form])
```

**문제:** "props가 변경되면 state를 리셋" 패턴 — Effect 없이 해결 가능

**권장:** `key` prop으로 컴포넌트를 리마운트하여 `useForm`의 `defaultValues`로 자연스럽게 초기화

```tsx
// 부모에서:
{
  permission && (
    <ExtendPermissionDrawerInner
      key={permission.tableName}
      permission={permission}
      onClose={onClose}
    />
  )
}

// 자식에서: useForm의 defaultValues에서 초기화, useEffect 삭제
```

---

### 3-5. database-tables-toolbar.hooks.ts — props에서 state 설정

**파일:** `src/app/pages/app/database/tables/_components/database-tables-toolbar.hooks.ts:14-21`

```tsx
// 현재 코드
useEffect(() => {
  const defaultSchema = getDefaultDatabaseTablesSchemaName(schemas)
  if (!defaultSchema) return
  if (!selectedSchema || !schemas.some((schema) => schema.schemaName === selectedSchema)) {
    setSelectedSchema(defaultSchema)
  }
}, [schemas, selectedSchema, setSelectedSchema])
```

**문제:** `schemas` prop이 변경될 때 명령적으로 state를 설정하는 패턴

**권장:** 파생 값으로 처리하거나, 쿼리 성공 핸들러에서 초기화

```tsx
// 방법 1: 인라인 파생
const effectiveSchema =
  selectedSchema && schemas.some((s) => s.schemaName === selectedSchema)
    ? selectedSchema
    : (getDefaultDatabaseTablesSchemaName(schemas) ?? '')
```

---

### 3-6. database-tables-toolbar.tsx — prop을 state에 미러링

**파일:** `src/app/pages/app/database/tables/_components/database-tables-toolbar.tsx:42-44`

```tsx
// 현재 코드
useEffect(() => {
  setKeywordInput(keyword)
}, [keyword])
```

**문제:** URL에서 파생된 `keyword`를 로컬 `keywordInput` state에 동기화

**권장:** 자식 컴포넌트로 분리하고 `key`로 리셋

```tsx
// 부모에서:
<KeywordInput
  key={keyword}
  defaultValue={keyword}
  onDebouncedChange={setKeyword}
/>

// 자식에서: useState(defaultValue)로 초기화, useEffect 불필요
```

---

### 3-7. pagination.tsx — prop을 state에 미러링 (Effect 2개)

**파일:** `src/components/pagination/pagination.tsx:28-36`

```tsx
// 현재 코드 — Effect 2개
useEffect(() => {
  setDraftPage(String(page))
}, [page])

useEffect(() => {
  if (disabled) {
    setDraftPage(String(page))
  }
}, [disabled, page])
```

**권장:** 자식 컴포넌트 + `key` 패턴, 또는 두 Effect를 하나로 병합

```tsx
// 방법 1: key 패턴
;<PageInput
  key={`${page}-${disabled}`}
  defaultValue={page}
  disabled={disabled}
  onCommit={onPageChange}
/>

// 방법 2: 병합
useEffect(() => {
  setDraftPage(String(page))
}, [page, disabled])
```

---

### 3-8. use-debounce.ts — ref 동기화 Effect

**파일:** `src/hooks/use-debounce.ts:39-41`

```tsx
// 현재 코드
useEffect(() => {
  callbackRef.current = callback
}, [callback])
```

**권장:** 렌더 중 직접 할당

```tsx
callbackRef.current = callback // Effect 불필요
```

---

## 4. Re-render 최적화 (MEDIUM)

### 4-1. Context value에 useMemo 누락

**파일:** `src/app/pages/app/sql/editor/_components/snippets/sql-snippet-search-context.tsx:24-29`

```tsx
// 현재 코드 — 매 렌더마다 새 객체 생성
const search = {
  searchText,
  setSearchText,
  debouncedSearchText,
  isSearching: trimmedSearchText.length > 0,
}
```

- 같은 폴더의 `sql-snippet-inline-rename-context.tsx`, `sql-snippet-clipboard-context.tsx`는 `useMemo`를 올바르게 사용
- 이 파일만 빠져 있어 **모든 consumer가 불필요하게 리렌더**됨

**권장:**

```tsx
const search = useMemo(
  () => ({
    searchText,
    setSearchText,
    debouncedSearchText,
    isSearching: trimmedSearchText.length > 0,
  }),
  [searchText, debouncedSearchText]
)
```

---

### 4-2. use-mobile.ts — useSyncExternalStore로 개선 가능

**파일:** `src/hooks/use-mobile.ts:8-15`

```tsx
// 현재 코드 — 초기값이 undefined
const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

React.useEffect(() => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const onChange = () => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  }
  mql.addEventListener('change', onChange)
  setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  return () => mql.removeEventListener('change', onChange)
}, [])
```

**권장:** `useSyncExternalStore`로 교체

```tsx
import { useSyncExternalStore } from 'react'

const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(callback: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
```

---

## 5. 추가 번들 최적화 (MEDIUM)

### 5-1. sql-formatter — 동적 import 가능

**파일:** `src/app/pages/app/sql/editor/_helpers/format-sql.ts:1`

```tsx
// 현재 코드
import { format } from 'sql-formatter'
```

- "포맷" 버튼 클릭 시에만 실행됨 (~50KB)

**권장:**

```tsx
export async function formatSql({ sql }: FormatSqlParams) {
  const { format } = await import('sql-formatter')
  return format(sql, { language: 'sql' })
}
```

---

### 5-2. 테이블 목록 → 상세 네비게이션에 prefetch 없음

**파일:** `src/app/pages/app/database/tables/_components/database-tables-data-table.tsx:108-136`

"데이터 보기" / "컬럼 보기" 링크에 hover prefetch를 추가하면 즉시 네비게이션 가능

```tsx
<Link
  to={...}
  onMouseEnter={() => {
    queryClient.prefetchQuery(getSchemaTableDataQueryOptions({ schema, tableId }))
  }}
>
```

---

## 6. 종합 평가

### 잘 되어 있는 부분

| 항목                           | 상태                                               |
| ------------------------------ | -------------------------------------------------- |
| Route-level code splitting     | 모든 페이지 lazy load                              |
| React Query 패턴               | `enabled`, 조건부 polling 등 적절히 사용           |
| 조건부 렌더링 (`&&`)           | 위험한 패턴 없음 (모든 numeric 가드에 `> 0` 사용)  |
| Inline component 정의          | 없음 — 모두 모듈 레벨에서 정의                     |
| Functional setState            | 적절히 사용됨 (`toggleFolder`, `useDisclosure` 등) |
| useRef for transient values    | `skipBlurRef`, `lastExecutedSqlRef` 등 적절히 사용 |
| date-fns / lucide-react import | Named import으로 tree-shaking 가능                 |

### 개선이 필요한 부분 요약

| 우선순위 | 항목                                                        | 건수 |
| -------- | ----------------------------------------------------------- | ---- |
| CRITICAL | 번들 사이즈 (recharts dead code, Monaco 정적 import)        | 2    |
| HIGH     | Request waterfall (순차 Suspense, 경계 누락, 이중 Suspense) | 3    |
| HIGH     | 불필요한 useEffect                                          | 8    |
| MEDIUM   | Re-render 최적화 (context useMemo, useSyncExternalStore)    | 2    |
| MEDIUM   | 추가 번들 최적화 (sql-formatter, prefetch)                  | 2    |
