-- 첨부 본문을 실제로 보관한다 (스펙 §4.2 완성).
--
--  * 지금까지는 이름·크기만 남기는 데모 스텁이었다 — storage 버킷에 본문을 올리고
--    행이 그 위치(storage_path)를 가리킨다.
--  * 기존 행은 본문이 없다. storage_path가 null이면 내려받을 수 없는 데모 데이터다 —
--    없는 파일을 지어내지 않는다.
--  * 감사 이벤트 ATTACHMENT_DOWNLOAD는 정의만 되고 쓰일 곳이 없었다 — 다운로드가
--    생기면서 비로소 쓰인다 (스펙 §11.4).

alter table attachments add column storage_path text;

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- 본문 접근도 데이터 정책(로그인 사용자 전면 개방)과 같은 수준을 유지한다
create policy "authenticated read attachments" on storage.objects
  for select to authenticated using (bucket_id = 'attachments');
create policy "authenticated upload attachments" on storage.objects
  for insert to authenticated with check (bucket_id = 'attachments');
create policy "authenticated delete attachments" on storage.objects
  for delete to authenticated using (bucket_id = 'attachments');
