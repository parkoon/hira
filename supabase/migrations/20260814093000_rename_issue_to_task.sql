-- 상위 항목의 어휘를 '작업'(task) 하나로 통일한다.
--
-- 지금까지 같은 것을 세 이름으로 불렀다 — UI는 '이슈', 테이블은 requests,
-- 컬럼은 issue_no. 읽는 사람이 매번 셋을 같은 것으로 번역해야 했다.
--
--   requests            -> tasks
--   requests.issue_no   -> tasks.task_no
--   subtasks.issue_no   -> subtasks.subtask_no
--   *.request_issue_no  -> *.task_no
--   *.subtask_issue_no  -> *.subtask_no
--
-- 하위작업은 이미 subtask라 그대로 둔다. 이름만 바꾸므로 데이터는 보존된다.
-- 제약·인덱스명도 같이 옮긴다 — 생성 타입(database.ts)에 관계명으로 노출되는 탓에
-- 여기를 빼먹으면 앱 코드에 issue_no가 되살아난다.

-- ---------------------------------------------------------------- enums

alter type request_status rename to task_status;

alter type audit_event_type rename value 'ISSUE_SUBMIT' to 'TASK_SUBMIT';
alter type audit_event_type rename value 'ISSUE_APPROVE' to 'TASK_APPROVE';
alter type audit_event_type rename value 'ISSUE_REJECT' to 'TASK_REJECT';
alter type audit_event_type rename value 'ISSUE_COMPLETE' to 'TASK_COMPLETE';
alter type audit_event_type rename value 'ISSUE_UPDATE' to 'TASK_UPDATE';

-- ---------------------------------------------------------------- tasks

alter table requests rename to tasks;
alter table tasks rename column issue_no to task_no;

alter table tasks rename constraint requests_pkey to tasks_pkey;
alter table tasks rename constraint requests_requester_id_fkey to tasks_requester_id_fkey;

alter index requests_status_idx rename to tasks_status_idx;
alter index requests_requester_idx rename to tasks_requester_idx;

-- ---------------------------------------------------------------- subtasks

alter table subtasks rename column issue_no to subtask_no;
alter table subtasks rename column parent_issue_no to parent_task_no;

alter table subtasks rename constraint subtasks_parent_issue_no_fkey to subtasks_parent_task_no_fkey;

-- ---------------------------------------------------------------- approvals

alter table approvals rename column request_issue_no to task_no;
alter table approvals rename column subtask_issue_no to subtask_no;

alter table approvals rename constraint approvals_request_issue_no_fkey to approvals_task_no_fkey;
alter table approvals rename constraint approvals_subtask_issue_no_fkey to approvals_subtask_no_fkey;

alter index approvals_request_kind_idx rename to approvals_task_kind_idx;

-- ---------------------------------------------------------------- evidences

alter table evidences rename column request_issue_no to task_no;
alter table evidences rename column subtask_issue_no to subtask_no;
alter table evidences rename column request_status to task_status;

alter table evidences rename constraint evidences_request_issue_no_fkey to evidences_task_no_fkey;
alter table evidences rename constraint evidences_subtask_issue_no_fkey to evidences_subtask_no_fkey;

alter index evidences_request_idx rename to evidences_task_idx;

-- ---------------------------------------------------------------- attachments

alter table attachments rename column request_issue_no to task_no;

alter table attachments rename constraint attachments_request_issue_no_fkey to attachments_task_no_fkey;

alter index attachments_request_idx rename to attachments_task_idx;

-- ---------------------------------------------------------------- status history

alter table status_history rename column request_issue_no to task_no;
alter table status_history rename column subtask_issue_no to subtask_no;

alter table status_history rename constraint status_history_request_issue_no_fkey to status_history_task_no_fkey;
alter table status_history rename constraint status_history_subtask_issue_no_fkey to status_history_subtask_no_fkey;

alter index status_history_request_idx rename to status_history_task_idx;

-- ---------------------------------------------------------------- subtask branches

alter table subtask_branches rename column subtask_issue_no to subtask_no;

alter table subtask_branches rename constraint subtask_branches_subtask_issue_no_fkey to subtask_branches_subtask_no_fkey;

-- ---------------------------------------------------------------- audit logs

alter table audit_logs rename column target_issue_no to target_task_no;
