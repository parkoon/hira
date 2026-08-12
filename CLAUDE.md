# CLAUDE.md

일반적인 LLM 코딩 실수를 줄이기 위한 행동 지침. 프로젝트별 규칙과 함께 적용한다.

**트레이드오프:** 이 지침은 속도보다 신중함을 우선한다. 사소한 작업은 판단해서 적용한다.

## 1. 코딩 전에 생각하기

**가정하지 않는다. 혼란을 숨기지 않는다. 트레이드오프를 드러낸다.**

구현 전에:

- 가정한 내용을 명시적으로 말한다. 불확실하면 묻는다.
- 해석이 여러 가지라면 모두 제시한다. 혼자 고르지 않는다.
- 더 단순한 접근이 있다면 말한다. 필요하면 반론한다.
- 불명확한 부분이 있으면 멈춘다. 무엇이 헷갈리는지 짚고 묻는다.

## 2. 단순함 우선

**문제를 해결하는 최소한의 코드. 추측성 코드 금지.**

- 요청받은 것 이상의 기능은 추가하지 않는다.
- 단 한 곳에서만 쓰는 코드에 추상화를 넣지 않는다.
- 요청받지 않은 "유연성"이나 "설정 가능성"을 넣지 않는다.
- 불가능한 시나리오에 대한 에러 핸들링을 추가하지 않는다.
- 200줄로 작성했는데 50줄로 가능하다면 다시 작성한다.

스스로 물어본다: "시니어 엔지니어가 보면 과하다고 할까?" 그렇다면 단순화한다.

## 3. 외과적 변경

**반드시 필요한 곳만 건드린다. 내가 만든 오염만 정리한다.**

기존 코드를 편집할 때:

- 인접한 코드, 주석, 포매팅을 "개선"하지 않는다.
- 망가지지 않은 코드를 리팩터하지 않는다.
- 내 방식과 달라도 기존 스타일을 따른다.
- 관련 없는 죽은 코드를 발견하면 언급만 하고 삭제하지 않는다.

내 변경으로 고아가 생겼다면:

- 내 변경으로 인해 사용되지 않게 된 import/변수/함수는 제거한다.
- 기존에 있던 죽은 코드는 요청받지 않는 한 건드리지 않는다.

기준: 변경된 모든 줄이 사용자의 요청으로 직접 거슬러 올라가야 한다.

## 4. 목표 중심 실행

**성공 기준을 정의한다. 확인될 때까지 반복한다.**

작업을 검증 가능한 목표로 변환한다:

- "유효성 검사 추가" → "잘못된 입력에 대한 테스트 작성 후 통과시키기"
- "버그 수정" → "버그를 재현하는 테스트 작성 후 통과시키기"
- "X 리팩터" → "리팩터 전후로 테스트 통과 확인"

여러 단계 작업은 간략한 계획을 먼저 제시한다:

```
1. [단계] → 검증: [확인 방법]
2. [단계] → 검증: [확인 방법]
3. [단계] → 검증: [확인 방법]
```

명확한 성공 기준이 있어야 독립적으로 반복 가능하다. "작동하게 만들기" 같은 기준은 계속 확인을 요구하게 된다.

---

**이 지침이 잘 작동하고 있다면:** diff에 불필요한 변경이 줄고, 과복잡으로 인한 재작성이 줄고, 실수 후가 아니라 구현 전에 명확화 질문이 나온다.

---

## 5. 프로젝트 개요

**common-react-template** — 팀 내부 React SPA 보일러플레이트. React + TypeScript + Vite 기반.

### 기술 스택

| 영역       | 라이브러리                               |
| ---------- | ---------------------------------------- |
| 프레임워크 | React 19, React Router v7                |
| 서버 상태  | TanStack Query v5                        |
| HTTP       | Axios (커스텀 타입 세이프 래퍼)          |
| URL 상태   | nuqs (URL search param 관리)             |
| 폼         | react-hook-form + zod                    |
| 스타일     | Tailwind CSS v4                          |
| 테이블     | ag-grid                                  |
| API 타입   | OpenAPI 자동 생성 (`@/shared/types/api`) |
| 목 서버    | MSW v2 (개발/테스트)                     |
| 테스트     | Vitest + Testing Library                 |
| E2E        | Playwright                               |

### 폴더 구조

```text
src/
├── app/                          # 라우터 + 페이지 컴포넌트
│   ├── bootstrap.tsx             # 앱 초기화 (모니터링 등)
│   ├── index.tsx                 # App 루트
│   ├── router.tsx                # 라우터 설정
│   └── pages/
│       └── {Page}/
│           ├── page.tsx
│           └── _components/      # 이 페이지에서만 쓰는 컴포넌트
├── features/                     # 도메인별 기능 (API path 첫 segment 기준)
│   └── {domain}/
│       ├── api/                  # queryOptions, mutation hooks
│       ├── constants/            # 도메인 전용 상수 (enum 메타데이터 등)
│       ├── components/           # 같은 도메인 내 cross-page 컴포넌트
│       ├── hooks/                # 도메인 전용 커스텀 훅
│       └── utils/                # 도메인 전용 순수 유틸 함수
├── shared/                       # 도메인 무관 공통 자원
│   ├── assets/                   # 폰트, 이미지
│   ├── components/
│   │   ├── ui/                   # atomic 디자인 시스템 (shadcn 기반)
│   │   ├── errors/               # 에러 바운더리 컴포넌트
│   │   └── layouts/              # 재사용 레이아웃 프리미티브
│   ├── config/                   # 환경변수(env.ts), 라우트 경로(paths.ts)
│   ├── constants/                # 앱 전역 상수
│   ├── hooks/                    # 범용 커스텀 훅
│   ├── lib/                      # 인프라 레이어 (api client, react-query)
│   ├── stores/                   # 전역 클라이언트 상태 (UI 상태만)
│   ├── types/                    # OpenAPI 자동생성 타입 (수기 편집 금지)
│   └── utils/                    # 순수 유틸 함수
└── mocks/                        # MSW 핸들러 + 인메모리 store
```

### 컴포넌트 배치 기준 (에스컬레이션 순서)

1. **`app/pages/{Page}/_components/`** — 기본. 한 페이지에서만 씀.
2. **`features/{domain}/components/`** — 같은 도메인에서 여러 페이지가 씀.
3. **`shared/components/`** — 도메인 무관 cross-domain 공통.

"두 번째로 필요해지는 순간"이 에스컬레이션 트리거. 미리 공통화하지 않는다.

### 핵심 컨벤션

- **타입 소스**: `@/shared/types/api`의 `paths`, `components`만 사용. 직접 타입 수기 작성 금지.
- **API 레이어**: `features/{domain}/api/`에 `get-*.ts` / `post-*.ts` 등 HTTP 메서드 prefix 파일로 분리.
- **라우트 경로**: `@/shared/config/paths`의 `paths` 객체로 중앙 관리. 문자열 하드코딩 금지.
- **URL search param**: `nuqs`로 관리. `useQueryState` / `useQueryStates` + 빌트인 파서 사용.
- **enum 라벨**: `features/{domain}/constants/metadata.ts`의 `*_META` 상수로 관리. 화면별 하드코딩 금지.
- **에러 처리**: query 에러는 `ErrorBoundary`로, mutation 에러는 `MutationCache` 전역 핸들러로 처리.
- **테스트 설명**: 한글로 작성.

---

## 6. 작업 흐름

### 기본 사이클

백엔드 작업이 완료되면 다음 순서로 진행한다.

```text
1. pnpm openapi           # API 타입 자동 생성
2. api.d.ts diff 확인     # 변경된 엔드포인트/스키마 파악 → 작업 범위 설계
3. features/{domain}/api/ # 필요한 queryOptions, mutation hook 작성
4. app/pages/             # 페이지 구현
```

### 변경 범위 원칙

**대부분의 변경은 `app/pages/`에서 발생한다.** 이것이 의도된 구조다.

| 레이어       | 변경 빈도 | 기준                                                           |
| ------------ | --------- | -------------------------------------------------------------- |
| `app/pages/` | 높음      | 기능 추가/수정의 기본 단위. 다른 페이지에 영향을 주면 안 된다. |
| `features/`  | 중간      | 같은 도메인의 여러 페이지가 동일 코드를 필요로 할 때만 수정.   |
| `shared/`    | 낮음      | 변경 시 전체 영향 범위가 크다. 타당성을 철저히 검토 후 수정.   |

### 중복 허용 원칙

페이지 간 코드가 비슷해 보여도 **미리 공통화하지 않는다.**

- 중복이 명확히 확인되고, 두 번째 사용처가 실제로 생겼을 때 `features/`로 올린다.
- 억지로 공통화하면 props가 불어나고 조건 분기가 생긴다. 유사한 코드 두 개가 독립적인 코드 하나보다 낫다.

### shared/ 수정 기준

`shared/`를 수정하기 전에 반드시 확인한다:

1. 정말 도메인 무관한 공통 자원인가?
2. `features/`에 두는 것으로 해결되지 않는가?
3. 변경이 기존 사용처에 미치는 영향을 모두 파악했는가?

"일단 shared에 넣고 나중에 정리"는 하지 않는다.

---

## 7. 참고 문서

문서 전체를 미리 읽지 않는다. 아래 작업에 해당할 때 그 파일만 Read로 가져온다.

### React

| 작업 상황                                 | 읽을 파일                                       |
| ----------------------------------------- | ----------------------------------------------- |
| 전반적인 React 패턴 리뷰가 필요할 때      | `docs/react/react-summary.md`                   |
| `useEffect` 작성 또는 의존성 배열 판단    | `docs/react/synchronizing-with-effects.md`      |
| Effect 없이 풀 수 있는지 판단             | `docs/react/you-might-not-need-an-effect.md`    |
| Effect 의존성 정리 또는 lint 경고 해소    | `docs/react/removing-effect-dependencies.md`    |
| Effect 내 이벤트 분리 (`useEffectEvent`)  | `docs/react/separating-events-from-effects.md`  |
| Effect 생명주기 이해 (마운트/동기화 구분) | `docs/react/lifecycle-of-reactive-effects.md`   |
| 커스텀 훅 추출 또는 설계                  | `docs/react/reusing-logic-with-custom-hooks.md` |
| `useRef` 또는 ref 값 저장                 | `docs/react/referencing-values-with-refs.md`    |
| DOM 직접 접근 (`ref`, `forwardRef`)       | `docs/react/manipulating-the-dom-with-refs.md`  |
| React 베스트 프랙티스 전반 점검           | `docs/react/review-react-best-practices.md`     |
