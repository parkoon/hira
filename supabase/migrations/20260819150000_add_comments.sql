-- 댓글 — 활동 로그(시스템 이력)와 별개인 사람의 대화 (Jira 이슈 뷰의 Comments).
--
--  * 반려 사유에 대한 반박, 질의응답이 지금은 도구 밖(메신저)으로 나간다.
--    기록이 남아야 하는 도구라 대화도 레코드 옆에 남긴다.
--  * 이력·증적과 같은 소유 구조 — 작업(부모)에도 하위작업(자식)에도 붙는다.
--  * 작성자는 이름이 아니라 profiles FK로 남긴다 — 본인 댓글만 수정·삭제할 수 있어
--    동명이인 안전한 id 판정이 필요하다 (이력의 actor_name과 다른 이유).
--  * 수정 시각은 트리거(touch_updated_at 재사용)가 찍는다. created_at과 같으면
--    수정된 적 없는 댓글이다 — null 초기값 대신 default now()로 두 컬럼을 맞춘다.

create table comments (
  id         bigint generated always as identity primary key,
  task_no    text references tasks (task_no) on delete cascade,
  subtask_no text references subtasks (subtask_no) on delete cascade,
  author_id  uuid not null references profiles (id),
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_owner_check check (num_nonnulls(task_no, subtask_no) = 1)
);

create index comments_task_idx on comments (task_no);
create index comments_subtask_idx on comments (subtask_no);

create trigger comments_touch_updated_at
  before update on comments
  for each row execute function touch_updated_at();

alter table comments enable row level security;
create policy "authenticated full access" on comments for all to authenticated using (true) with check (true);
