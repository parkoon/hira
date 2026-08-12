-- 이슈 등록에서 참고 링크를 걷어냈다 — 링크는 이제 단계 증적에만 붙는다.
-- 소유자가 증적 하나뿐이라 owner check 대신 not null이 같은 역할을 한다.
alter table reference_links drop constraint reference_links_owner_check;

drop index reference_links_request_idx;

alter table reference_links drop column request_issue_no;

alter table reference_links alter column evidence_id set not null;
