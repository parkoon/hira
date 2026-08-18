-- 계층 조회가 상·하위를 같은 기준으로 정렬하려면 두 층위가 같은 시각 컬럼을 가져야 한다.
--
--  * 하위작업에는 등록일이 없었다 — subtask_no 꼬리번호가 사실상 등록 순서라 지금까지는
--    그걸로 갈음했지만, 정렬 기준이 화면에 '등록일'로 노출되면 근거가 되는 컬럼이 필요하다.
--  * 수정일은 상·하위 모두 없어 새로 넣는다. 앱이 빠뜨릴 여지를 없애려고 트리거로 갱신한다.
--  * 기존 행은 상태 이력 시각으로 백필한다 — 이력이 없는 건은 하위작업이면 부모 등록일로,
--    작업이면 자기 등록일로 떨어진다. 없는 시각을 지어내지 않는다.
--  * 등록일 타입은 tasks.created_at(date)에 맞춘다 — 한 컬럼만 timestamptz면 정렬 표현이 갈린다.

alter table subtasks add column created_at date not null default current_date;
alter table tasks add column updated_at timestamptz not null default now();
alter table subtasks add column updated_at timestamptz not null default now();

update subtasks s
set created_at = coalesce(
  (select min(h.occurred_at)::date from status_history h where h.subtask_no = s.subtask_no),
  (select t.created_at from tasks t where t.task_no = s.parent_task_no)
);

update tasks t
set updated_at = coalesce(
  (select max(h.occurred_at) from status_history h where h.task_no = t.task_no),
  t.created_at::timestamptz
);

update subtasks s
set updated_at = coalesce(
  (select max(h.occurred_at) from status_history h where h.subtask_no = s.subtask_no),
  s.created_at::timestamptz
);

create function touch_updated_at() returns trigger
  language plpgsql set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger tasks_touch_updated_at
  before update on tasks
  for each row execute function touch_updated_at();

create trigger subtasks_touch_updated_at
  before update on subtasks
  for each row execute function touch_updated_at();
