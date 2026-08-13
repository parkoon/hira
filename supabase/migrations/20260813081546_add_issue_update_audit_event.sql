-- 요청대기중·반려 상태의 이슈 내용 수정을 감사 로그에 남기기 위한 이벤트 종류 (스펙 §11.4)
alter type audit_event_type add value if not exists 'ISSUE_UPDATE';
