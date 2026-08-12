-- 하위작업에서 만든 Gitea 브랜치 기록 — 하위작업 상세의 개발 패널이 보여준다.
create table subtask_branches (
  id               bigint generated always as identity primary key,
  subtask_issue_no text not null references subtasks (issue_no) on delete cascade,
  repo_full_name   text not null,
  branch_name      text not null,
  branch_url       text not null,
  created_by       text not null,
  created_at       timestamptz not null default now()
);

create index subtask_branches_subtask_idx on subtask_branches (subtask_issue_no);

alter table subtask_branches enable row level security;

create policy "authenticated full access" on subtask_branches for all to authenticated using (true) with check (true);
