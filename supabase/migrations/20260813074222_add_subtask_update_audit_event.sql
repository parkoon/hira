-- 하위작업 제목·설명·목표일 수정을 감사 로그에 남기기 위한 이벤트 종류 (스펙 §11.4)
alter type audit_event_type add value if not exists 'SUBTASK_UPDATE';
