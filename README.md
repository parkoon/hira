# Hira

타부서(현업)가 개발팀에 작업을 의뢰하고, 팀 내부에서 이를 하위 작업으로 나눠 진행 상황을 관리하는 작업 관리 서비스.

범용 이슈 트래커의 커스터마이징(커스텀 워크플로, JQL, 애자일 보드) 대신 개발 프로세스(분석설계 → 개발 → 제3자검증 → 인수테스트 → 이행 → 이행후점검)를 고정 워크플로로 내장해, 설정 없이 바로 쓰는 것을 목표로 한다.

## 기술 스택

React 19 · TypeScript · Vite · React Router v7 · TanStack Query v5 · Tailwind CSS v4 · shadcn/ui · react-hook-form + zod · ag-grid · Supabase · Vitest · Playwright

## 실행

```bash
pnpm install
cp .env.example .env.local   # Supabase URL / anon key 입력
pnpm dev
```

## 주요 기능

- **작업의뢰(부모) / 하위작업(자식) 2계층** — 의뢰는 승인에 집중하고, 실행 관리는 하위작업에서 한다.
- **유형별 고정 워크플로** — 배포형과 비배포형이 서로 다른 단계를 거친다.
- **단계별 증적** — 단계를 끝낼 때 산출물을 받아 append-only로 쌓는다. 정정해도 이전 값이 남는다.
- **감사 로그** — 인증·의뢰·하위작업·역할 변경을 한 테이블에 append-only로 기록한다.
- **브랜치 생성** — 하위작업 화면에서 하위작업 번호가 들어간 브랜치를 만들고 링크로 남긴다.

## 참고

- 사용자·조직 데이터는 전부 **가상 인물**이다 (`src/features/users/data/`). 시드는 `pnpm supabase:seed`로 넣는다.
- Gitea 연동(저장소 조회·브랜치 생성)은 목(mock)이다. `src/features/gitea/api/`의 service 본문을 실제 호출로 바꾸면 된다.
- 인증은 데모용으로 단순화되어 있다. 사번을 이메일로 바꿔 Supabase Auth에 붙이며, 권한은 화면 레벨에서만 확인한다.
