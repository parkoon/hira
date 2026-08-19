-- 인앱 알림 — 내 작업에 생긴 움직임이 나를 찾아오게 한다 (Jira의 알림 벨).
--
--  * 수신자별 행으로 쌓는다. 문장은 쓰는 쪽이 완성해 저장한다 — 감사 로그의 detail과
--    같은 방식이라 읽는 쪽에 조립 로직이 없다.
--  * 하위작업 알림은 부모 작업 번호를 함께 갖는다 — 하위작업 상세는 부모 번호가
--    있어야 열린다. 레코드가 지워지면 알림도 같이 진다 (CASCADE).
--  * 본인이 한 일은 본인에게 알리지 않는다 — 판정은 쓰는 헬퍼(pushNotification)가 한다.

create table notifications (
  id           bigint generated always as identity primary key,
  recipient_id uuid not null references profiles (id) on delete cascade,
  actor_name   text not null,
  message      text not null,
  task_no      text references tasks (task_no) on delete cascade,
  subtask_no   text references subtasks (subtask_no) on delete cascade,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- 벨은 늘 "내 것 중 최신"만 읽는다
create index notifications_recipient_idx on notifications (recipient_id, id desc);

alter table notifications enable row level security;
create policy "authenticated full access" on notifications for all to authenticated using (true) with check (true);
