-- 참고 링크 스펙아웃 후 label을 따로 입력받는 UI가 없다 — 항상 url 복사본만 저장돼 의미가 없다
alter table reference_links drop column label;
