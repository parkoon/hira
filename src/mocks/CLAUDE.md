# src/mocks — MSW 목 서버

## 구조

```text
src/mocks/
├── handlers/
│   ├── index.ts       # 전체 핸들러 통합 export
│   └── {domain}.ts    # 도메인별 핸들러
├── store.ts           # 인메모리 상태 + resetStore()
├── browser.ts         # 브라우저 환경 (개발 서버)
└── index.ts           # enableMocking() — main.tsx에서 호출
```

## 핵심 원칙

**핸들러는 `handlers/`에만 정의한다.** `browser.ts`(개발)와 테스트(`setupServer`)가 동일한 핸들러 배열을 공유한다. 개발 중 고친 핸들러가 테스트에도 반영되고, 테스트에서 잡은 버그가 개발 환경에도 적용된다.

---

## 핸들러 작성 규칙

MSW v2 기준. `res(ctx.json())` 패턴(v1)은 사용하지 않는다.

```ts
import { http, HttpResponse } from 'msw'

export const postsHandlers = [
  // 정상 응답
  http.get('/api/v1/posts', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '0')
    return HttpResponse.json({
      success: true,
      data: { items: store.posts.slice(page * 10, (page + 1) * 10) },
    })
  }),

  // 에러 응답
  http.get('/api/v1/posts/:id', ({ params }) => {
    const post = store.posts.find((p) => p.id === Number(params.id))
    if (!post) {
      return HttpResponse.json(
        {
          success: false,
          data: null,
          error: { code: 'NOT_FOUND', message: '찾을 수 없습니다.', fields: [] },
        },
        { status: 404 }
      )
    }
    return HttpResponse.json({ success: true, data: post, error: null })
  }),

  // 네트워크 장애 시뮬레이션
  http.get('/api/v1/posts/network-error', () => HttpResponse.error()),
]
```

`request.url`은 string이다. URL 파싱이 필요하면 `new URL(request.url)`로 직접 생성한다.

---

## 인메모리 스토어

핸들러 간 상태를 공유하는 단일 스토어. 테스트마다 `resetStore()`를 호출해 격리한다.

```ts
// store.ts
const initialState = { ... }

export const store = { ...clone(initialState) }

export function resetStore() {
  Object.assign(store, clone(initialState))
}
```

테스트 설정:

```ts
// vitest.setup.ts
import { server } from '@/mocks/browser'
import { resetStore } from '@/mocks/store'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers() // 테스트별 오버라이드 제거
  resetStore() // 스토어 초기 상태로 복원
})
afterAll(() => server.close())
```

순서가 중요하다. `resetHandlers` 먼저, `resetStore` 다음.

---

## 목 데이터 품질 기준

**최소한의 데이터가 아닌 비즈니스 로직을 커버하는 풍부한 데이터**로 구성한다.

왜냐면 — 실제 서비스에서 발생하는 버그의 대부분은 "엣지 케이스 데이터"에서 생긴다. 최소 픽스처는 이를 숨긴다.

### 체크리스트

- **status 조합 완비**: 가능한 모든 enum 값을 데이터셋에 포함한다.
  ```ts
  // X — DRAFT만 있으면 status 필터 로직을 테스트할 수 없음
  const posts = [{ status: 'DRAFT' }, { status: 'DRAFT' }]

  // O
  const posts = [{ status: 'DRAFT' }, { status: 'PUBLISHED' }, { status: 'ARCHIVED' }]
  ```
- **경계값 포함**: 빈 배열, 1개, 페이지네이션 경계(10개 딱 맞는 경우), 100개+
- **nullable 필드**: 선택값(optional)은 일부는 값 있음, 일부는 null/undefined
- **날짜 다양성**: 오늘 생성, 1년 전 생성, 만료 임박, 이미 만료
- **관계 데이터 일관성**: 참조하는 ID가 실제 존재하는 데이터를 가리켜야 함

### 팩토리 함수 패턴 (데이터 규모가 커질 때)

정적 배열 대신 팩토리 함수를 사용하면 테스트별 커스터마이징이 쉽다.

```ts
// mocks/factories/post.ts
let seq = 1

export function createPost(overrides: Partial<Post> = {}): Post {
  return {
    id: seq++,
    title: `게시글 제목 ${seq}`,
    content: `본문 내용 ${seq}. 실제 서비스에서 나올 법한 길이의 텍스트.`,
    author: '홍길동',
    status: 'DRAFT',
    createdAt: new Date(Date.now() - 86400000 * seq).toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// 사용
const posts = [
  createPost({ status: 'PUBLISHED' }),
  createPost({
    status: 'ARCHIVED',
    title: '제목이 아주 길어서 말줄임 처리가 되어야 하는 게시글입니다',
  }),
  createPost({ content: '' }), // 빈 본문 엣지케이스
]
```

---

## 테스트에서 핸들러 오버라이드

특정 테스트에서만 다른 응답이 필요할 때 `server.use()`로 일시적으로 덮어쓴다.

```ts
it('서버 오류 시 에러 메시지를 표시한다', async () => {
  server.use(
    http.get('/api/v1/posts', () =>
      HttpResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류' } },
        { status: 500 }
      )
    )
  )
  // ... 테스트
  // afterEach의 server.resetHandlers()가 자동으로 원복
})
```

---

## MSW vs vi.mock 선택 기준

| 상황                                      | 선택        |
| ----------------------------------------- | ----------- |
| API 호출 포함 컴포넌트/훅 통합 테스트     | MSW         |
| 에러 응답, 로딩 상태, 재시도 로직         | MSW         |
| 순수 함수 유닛 테스트                     | `vi.mock()` |
| 특정 함수가 올바른 인자로 호출되는지 검증 | `vi.mock()` |

MSW는 실제 HTTP 경로를 타기 때문에 통합 버그를 잡는다. `vi.mock()`은 빠르지만 구현에 강하게 결합된다.

---

## onUnhandledRequest: 'error' 필수

등록되지 않은 요청이 테스트 중 발생하면 에러로 처리한다. `'warn'`은 조용히 넘어가서 핸들러 누락을 감지하지 못한다.

```ts
server.listen({ onUnhandledRequest: 'error' })
```
