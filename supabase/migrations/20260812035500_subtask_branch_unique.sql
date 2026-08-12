-- 하위작업과 브랜치는 1:1이다 — 두 번째 브랜치 기록을 DB에서 막는다
alter table subtask_branches
  add constraint subtask_branches_subtask_unique unique (subtask_issue_no);

-- unique 제약이 같은 컬럼에 인덱스를 만들므로 조회용 인덱스는 걷어낸다
drop index subtask_branches_subtask_idx;
