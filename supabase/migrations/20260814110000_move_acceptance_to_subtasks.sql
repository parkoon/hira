-- 인수 테스트를 부모 작업에서 배포형 하위작업 단계로 옮긴다.
--
--  * 부모 상태에서 '인수 테스트중'·'이행 대기중'을 뺀다 — 부모는 하위작업의 집계가 되고,
--    작업중에서 하위작업 전건 완료 후 바로 최종 완료로 간다.
--  * 하위작업 상태에 'ACCEPTANCE'(인수 테스트중)를 넣는다 — 배포형이 기능 테스트를
--    마치면 요청자가 하위작업 단위로 인수를 확인하고, 확인이 끝나야 이행 대기중이 된다.
--  * 적용 시점에 두 상태에 걸린 작업과 부모 증적이 0건임을 확인했다 — 데이터 리매핑 없음.

-- 하위작업 enum에 인수 단계 추가 (기능테스트중과 이행대기중 사이)
alter type subtask_status add value 'ACCEPTANCE' before 'DEPLOY_WAITING';

-- 부모 enum에서 두 값 제거 — Postgres는 enum 값 삭제가 없어 타입을 재생성한다.
-- evidences.task_status는 부모 증적 컬럼으로 남는다(현재 0건, 앱은 더 쓰지 않음).
create type task_status_new as enum (
  'DRAFT', 'PENDING_APPROVAL', 'IN_PROGRESS', 'DONE', 'REJECTED'
);

alter table tasks alter column status drop default;
alter table tasks alter column status type task_status_new
  using status::text::task_status_new;
alter table tasks alter column status set default 'DRAFT';

alter table evidences alter column task_status type task_status_new
  using task_status::text::task_status_new;

drop type task_status;
alter type task_status_new rename to task_status;
