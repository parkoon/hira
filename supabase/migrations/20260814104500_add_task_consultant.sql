-- 사전협의자 — 요청자가 등록 전에 누구와 협의했는지 (등록 폼 필수 항목).
--
-- 이름 텍스트가 아니라 profiles FK로 둔다. 동명이인·오타 없이 "내가 협의해준 건"을
-- 나중에 집계할 수 있어야 하고, 후보가 이미 앱 안에 있는 작업자 이상 사용자다.
--
-- 폼에서는 필수지만 컬럼은 nullable이다 — 이 필드가 생기기 전에 등록된 건에는
-- 넣어줄 값이 없다. 없는 값을 지어내는 대신 null로 두고 화면이 '없음'으로 읽는다.
alter table tasks add column consultant_id uuid references profiles (id);
