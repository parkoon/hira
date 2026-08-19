# src/shared — 도메인 무관 공통 자원

특정 도메인에 속하지 않고 `app/`, `features/` 전체에서 참조하는 공통 자원.

## 의존 방향

```text
app/  →  shared/
features/{domain}/  →  shared/
```

`shared/` 내부에서 `app/`, `features/`를 절대 import하지 않는다.

---

## assets/ — 정적 자원

폰트(`fonts/`), 이미지(`images/`) 등 정적 파일. CSS에서 상대 경로로 참조한다.

---

## components/ — 공통 UI 컴포넌트

```text
shared/components/
├── ui/        # atomic 디자인 시스템 (shadcn 기반). 비즈니스 로직 포함 금지.
├── errors/    # 에러 바운더리 컴포넌트
└── layouts/   # 재사용 레이아웃 프리미티브 (두 곳 이상 사용 시)
```

배치 기준:

| 사용 범위                  | 위치                            |
| -------------------------- | ------------------------------- |
| 한 페이지에서만 사용       | `app/pages/{Page}/_components/` |
| 같은 도메인 내 여러 페이지 | `features/{domain}/components/` |
| 두 개 이상 도메인에서 사용 | `shared/components/`            |

두 번째 도메인에서 필요해지는 순간 올린다. 미리 올리지 않는다.

---

## config/ — 환경변수 및 라우트 경로

- `env.ts` — `import.meta.env` 직접 참조 금지. 반드시 이 파일을 통한다.
- `paths.ts` — 라우트 경로 문자열 하드코딩 금지. 반드시 `paths` 객체를 참조한다.

```ts
// O
import { paths } from '@/shared/config/paths'
navigate(paths.app.posts.root)

// X
navigate('/app/posts')
```

---

## hooks/ — 범용 커스텀 훅

도메인에 무관하게 어디서든 사용할 수 있는 커스텀 훅. 특정 도메인 API에 의존하지 않는다.

단일 도메인 전용 훅은 `features/{domain}/hooks/`에 둔다.

| 훅             | 역할                         |
| -------------- | ---------------------------- |
| `use-confirm`  | confirm 다이얼로그 상태 관리 |
| `use-debounce` | 값 디바운싱                  |

---

## lib/ — 외부 라이브러리 설정/래핑

외부 라이브러리를 프로젝트에 맞게 설정하거나 래핑하는 인프라 레이어.
순수 유틸 함수는 `utils/`에 둔다 ("외부 라이브러리 설정인가?" 가 lib/utils 구분 기준).

- `supabase.ts` — 단일 `supabase` 클라이언트 인스턴스. 직접 생성하지 않는다.
- `supabase-error.ts` — Supabase 에러 판별 + 한국어 문구 매핑 (`isSupabaseError`, `getSupabaseErrorMessage`).
- `audit-log.ts` — 감사 로그 기록 헬퍼 (`recordAuditLog`).
- `notifications.ts` — 인앱 알림 기록 헬퍼 (`pushNotification`). 조회·표시는 `features/notifications/`가 맡는다.
- `react-query.ts` — `QueryClient` 설정 + 전역 에러 핸들링.
  - query 에러 → `ErrorBoundary`
  - mutation 에러 → `MutationCache` 전역 핸들러
  - 호출 측에서 직접 처리할 때만 `meta: { suppressGlobalError: true }` 추가.

---

## types/ — Supabase 자동생성 타입

`database.ts`는 Supabase 타입 생성 결과. **수기 편집 금지** — 마이그레이션 적용 후 재생성한다.

앱 레이어에서 `Database['public']['Tables'][...]` row 타입을 직접 참조하지 않는다.
도메인 DTO 타입은 `features/{domain}/api/types.ts`에 정의해서 사용한다.

---

## constants/ — 앱 전역 상수

도메인 무관 앱 전역 상수. 도메인 전용 상수는 `features/{domain}/constants/`에 둔다.

---

## stores/ — 전역 클라이언트 상태

Zustand 등 전역 클라이언트 상태. 서버 상태(API 캐시)는 TanStack Query로 관리하므로 여기는 UI 상태만 둔다.

---

## utils/ — 순수 유틸 함수

도메인 무관 순수 함수. 외부 상태나 사이드이펙트 없음.

- `cn.ts` — Tailwind 클래스 병합 (`clsx` + `tailwind-merge`).
- `enum.ts` — enum 헬퍼 유틸 + 공통 타입 (`EnumMetadata`, `EnumMetadataMap` 등).
  - `toEnumOptions` — filter/select option 생성 (order 기준 정렬)
  - `isKnownEnumValue` — URL search param 타입 가드
  - `getEnumLabel` — 라벨 조회 + fallback

도메인별 `*_META` 상수는 여기에 두지 않는다. `features/{domain}/constants/metadata.ts`에 둔다.
