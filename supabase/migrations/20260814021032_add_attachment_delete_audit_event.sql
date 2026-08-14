-- 이슈 수정에서 첨부를 뗄 수 있게 되면서 필요해진 기록 이벤트 (스펙 §11.4)
alter type audit_event_type add value if not exists 'ATTACHMENT_DELETE';
