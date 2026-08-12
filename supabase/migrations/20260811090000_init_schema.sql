-- HIRA 업무요청 관리 — 초기 스키마
--
-- 설계 원칙
--  * 화면이 쓰던 인메모리 모델(`features/issues/api/types.ts`)을 정규화한다.
--    데모 종료 후 실서버를 구성할 때 이 스키마가 청사진이 된다.
--  * 이슈번호(WR-YYYY-NNNN)는 업무상 의미가 있는 자연키라 PK로 쓴다.
--  * 증적·결재·이력은 부모(이슈) 또는 자식(하위작업) 어느 쪽에도 붙을 수 있어
--    양쪽 FK를 두고 CHECK로 "정확히 한쪽"을 강제한다.
--  * 시각은 timestamptz, 날짜만 의미 있는 값은 date로 구분한다.

-- ---------------------------------------------------------------- enums

create type user_role as enum ('REQUESTER', 'WORKER', 'LEAD', 'ADMIN');

create type request_status as enum (
  'DRAFT', 'PENDING_APPROVAL', 'IN_PROGRESS',
  'ACCEPTANCE', 'DEPLOY_WAITING', 'DONE', 'REJECTED'
);

create type subtask_type as enum ('DEPLOY', 'NON_DEPLOY');

-- 배포형/비배포형이 서로 다른 부분집합을 쓴다. 실제 단계 순서는
-- `constants/transitions.ts`의 getSubtaskFlow가 정한다.
create type subtask_status as enum (
  'TODO', 'ANALYSIS', 'DEVELOPMENT', 'DBA_VERIFICATION', 'THIRD_PARTY',
  'FUNCTIONAL_TEST', 'DEPLOY_WAITING', 'POST_DEPLOY_CHECK',
  'IN_PROGRESS', 'REVIEW', 'DONE'
);

create type approval_kind as enum ('COMPLIANCE', 'CONSUMER_PROTECTION', 'DBA');

create type priority as enum ('URGENT', 'HIGH', 'NORMAL', 'LOW');

create type history_via as enum ('MANUAL', 'API');

create type audit_event_type as enum (
  'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT',
  'ISSUE_SUBMIT', 'ISSUE_APPROVE', 'ISSUE_REJECT', 'ISSUE_COMPLETE',
  'SUBTASK_CREATE', 'SUBTASK_TRANSITION', 'ROLE_CHANGE',
  'ATTACHMENT_UPLOAD', 'ATTACHMENT_DOWNLOAD'
);

-- ---------------------------------------------------------------- profiles

-- auth.users와 1:1. 역할·소속 등 업무 속성이 여기 붙는다.
create table profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  login_id        text not null unique,
  name            text not null,
  dept            text not null,
  role            user_role not null default 'REQUESTER',
  contact         text not null default '',
  -- 서비스개발실 외부 소속 협업자 여부 (표시용)
  external        boolean not null default false,
  role_changed_at date,
  role_changed_by text
);

-- 화면이 담당자·요청자를 이름으로 표시하고 이름으로 찾는다.
create index profiles_name_idx on profiles (name);

-- ---------------------------------------------------------------- requests

create table requests (
  issue_no                   text primary key,
  title                      text not null,
  description                text not null default '',
  status                     request_status not null default 'DRAFT',
  priority                   priority not null default 'NORMAL',
  requester_id               uuid not null references profiles (id),
  due_date                   date not null,
  created_at                 date not null default current_date,
  submitted_at               timestamptz,
  -- '예'면 컴플라이언스 결재가 붙는다 (시나리오 3)
  handles_personal_data      boolean not null default false,
  -- '예'면 소비자보호 결재가 붙는다 (시나리오 3)
  consumer_protection_target boolean not null default false,
  dark_pattern_checked       boolean not null default false
);

create index requests_status_idx on requests (status);
create index requests_requester_idx on requests (requester_id);

-- ---------------------------------------------------------------- subtasks

create table subtasks (
  issue_no                 text primary key,
  parent_issue_no          text not null references requests (issue_no) on delete cascade,
  type                     subtask_type not null,
  title                    text not null,
  description              text not null default '',
  status                   subtask_status not null default 'TODO',
  assignee_id              uuid references profiles (id),
  due_date                 date,
  completed_at             date,
  -- null이면 DBA 검증 단계를 거치지 않는다. 체크 여부와 내용을 한 필드로 묶어
  -- "체크했는데 내용이 없는" 상태를 만들지 않는다 (시나리오 8)
  dba_verification_request text
);

create index subtasks_parent_idx on subtasks (parent_issue_no);
create index subtasks_assignee_idx on subtasks (assignee_id);
create index subtasks_status_idx on subtasks (status);

-- ---------------------------------------------------------------- approvals

-- 결재선 시스템 연동 전 임시 모델 (시나리오 각주 2).
-- 필요한 결재 종류는 이슈 속성에서 파생하고, 여기엔 떨어진 건만 쌓인다.
-- 결재자는 앱 사용자가 아닐 수 있어(외부 결재선) FK가 아니라 이름으로 남긴다.
create table approvals (
  id               bigint generated always as identity primary key,
  request_issue_no text references requests (issue_no) on delete cascade,
  subtask_issue_no text references subtasks (issue_no) on delete cascade,
  kind             approval_kind not null,
  approved_by      text not null,
  approved_at      timestamptz not null default now(),
  constraint approvals_owner_check check (num_nonnulls(request_issue_no, subtask_issue_no) = 1)
);

-- 같은 종류의 결재는 한 번만 쌓인다
create unique index approvals_request_kind_idx
  on approvals (request_issue_no, kind) where request_issue_no is not null;
create unique index approvals_subtask_kind_idx
  on approvals (subtask_issue_no, kind) where subtask_issue_no is not null;

-- ---------------------------------------------------------------- evidences

-- 단계 완료 시 남기는 증적 (시나리오 각주 3).
-- 정정은 덮어쓰지 않고 새 건을 쌓는다 — 같은 status의 마지막 건이 유효값이고
-- 앞선 건들은 정정 이력으로 남는다.
-- status는 소유자에 따라 쓰는 enum이 달라 컬럼을 나누고 CHECK로 짝을 맞춘다.
create table evidences (
  id               bigint generated always as identity primary key,
  request_issue_no text references requests (issue_no) on delete cascade,
  subtask_issue_no text references subtasks (issue_no) on delete cascade,
  request_status   request_status,
  subtask_status   subtask_status,
  memo             text not null default '',
  recorded_by      text not null,
  recorded_at      timestamptz not null default now(),
  constraint evidences_owner_check check (
    (request_issue_no is not null and subtask_issue_no is null
      and request_status is not null and subtask_status is null)
    or
    (subtask_issue_no is not null and request_issue_no is null
      and subtask_status is not null and request_status is null)
  )
);

create index evidences_request_idx on evidences (request_issue_no, request_status);
create index evidences_subtask_idx on evidences (subtask_issue_no, subtask_status);

-- ---------------------------------------------------------------- attachments / links

-- 첨부는 이슈 본문에도, 단계 증적에도 붙는다.
create table attachments (
  id               bigint generated always as identity primary key,
  request_issue_no text references requests (issue_no) on delete cascade,
  evidence_id      bigint references evidences (id) on delete cascade,
  file_name        text not null,
  size             bigint not null default 0,
  constraint attachments_owner_check check (num_nonnulls(request_issue_no, evidence_id) = 1)
);

create index attachments_request_idx on attachments (request_issue_no);
create index attachments_evidence_idx on attachments (evidence_id);

-- 참고 링크도 이슈 본문과 단계 증적 양쪽에 붙는다.
-- 이행 단계 증적의 "첫 링크"가 배포 완료 URL이라 순서가 의미를 갖는다 (시나리오 17).
create table reference_links (
  id               bigint generated always as identity primary key,
  request_issue_no text references requests (issue_no) on delete cascade,
  evidence_id      bigint references evidences (id) on delete cascade,
  url              text not null,
  label            text not null default '',
  position         integer not null default 0,
  constraint reference_links_owner_check check (num_nonnulls(request_issue_no, evidence_id) = 1)
);

create index reference_links_request_idx on reference_links (request_issue_no, position);
create index reference_links_evidence_idx on reference_links (evidence_id, position);

-- ---------------------------------------------------------------- status history

-- 상태 전이 이력. from/to는 이슈·하위작업 상태가 섞이고 하위작업 생성처럼
-- 전이가 아닌 활동도 기록되므로 앱 타입(StatusHistoryEntry)과 같이 text로 둔다.
create table status_history (
  id               bigint generated always as identity primary key,
  request_issue_no text references requests (issue_no) on delete cascade,
  subtask_issue_no text references subtasks (issue_no) on delete cascade,
  occurred_at      timestamptz not null default now(),
  actor_name       text not null,
  from_status      text,
  to_status        text not null,
  via              history_via not null default 'MANUAL',
  reason           text,
  constraint status_history_owner_check check (num_nonnulls(request_issue_no, subtask_issue_no) = 1)
);

create index status_history_request_idx on status_history (request_issue_no, occurred_at desc);
create index status_history_subtask_idx on status_history (subtask_issue_no, occurred_at desc);

-- ---------------------------------------------------------------- audit logs

-- 스펙 §11.4 기록 이벤트. API 토큰에 의한 이벤트는 행위자가 없어 'unknown'으로 남는다.
create table audit_logs (
  id              bigint generated always as identity primary key,
  occurred_at     timestamptz not null default now(),
  actor_name      text not null,
  event_type      audit_event_type not null,
  target_label    text,
  -- 이슈 번호 대상이면 상세 화면으로 이동할 수 있다. 삭제된 이슈도 감사 기록은
  -- 남아야 하므로 FK를 걸지 않는다.
  target_issue_no text,
  detail          text,
  ip_address      text not null default ''
);

create index audit_logs_occurred_idx on audit_logs (occurred_at desc);
create index audit_logs_event_idx on audit_logs (event_type);

-- ---------------------------------------------------------------- RLS
--
-- 데모 범위상 역할별 권한은 화면 UI가 판정한다("보이는 버튼이 곧 권한").
-- DB에서는 역할을 강제하지 않되, 로그인하지 않은 트래픽에는 열어두지 않는다.
-- 실서버 재구성 시 이 정책을 역할 기반으로 좁히는 것이 다음 단계다.

alter table profiles        enable row level security;
alter table requests        enable row level security;
alter table subtasks        enable row level security;
alter table approvals       enable row level security;
alter table evidences       enable row level security;
alter table attachments     enable row level security;
alter table reference_links enable row level security;
alter table status_history  enable row level security;
alter table audit_logs      enable row level security;

create policy "authenticated full access" on profiles        for all to authenticated using (true) with check (true);
create policy "authenticated full access" on requests        for all to authenticated using (true) with check (true);
create policy "authenticated full access" on subtasks        for all to authenticated using (true) with check (true);
create policy "authenticated full access" on approvals       for all to authenticated using (true) with check (true);
create policy "authenticated full access" on evidences       for all to authenticated using (true) with check (true);
create policy "authenticated full access" on attachments     for all to authenticated using (true) with check (true);
create policy "authenticated full access" on reference_links for all to authenticated using (true) with check (true);
create policy "authenticated full access" on status_history  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on audit_logs      for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------- 가입 훅

-- 사내 계정 최초 로그인 시 요청자 권한이 자동 부여된다 (스펙 §3.2).
create function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, login_id, name, dept, contact)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'login_id', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'dept', ''),
    coalesce(new.raw_user_meta_data ->> 'contact', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
