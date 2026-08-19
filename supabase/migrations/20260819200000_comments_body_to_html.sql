-- 댓글 본문을 리치 텍스트(HTML)로 전환한다.
--
--  * 에디터가 Tiptap으로 바뀌면서 본문 형식이 평문에서 HTML이 된다. 형식이 섞여 있으면
--    렌더러가 두 갈래를 타야 하므로, 이미 쌓인 평문 댓글을 문단으로 감싸 한 형식으로 만든다.
--  * 평문의 특수문자는 HTML로 이스케이프하고, 줄바꿈은 문단 경계로 바꾼다.

update comments
set body = '<p>'
  || replace(
       replace(replace(replace(body, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'),
       e'\n', '</p><p>'
     )
  || '</p>'
where body not like '<p>%';
