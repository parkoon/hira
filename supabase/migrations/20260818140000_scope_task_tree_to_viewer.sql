-- 계층 조회에 열람 범위를 건다 (스펙 §3.3·§4.3).
--
--  * 지금까지 이 함수는 RLS에만 기댔는데, 정책이 `to authenticated using (true)`라
--    로그인만 하면 전부 보였다. 목록 화면이 쓰던 규칙(selectVisibleTasks)이 서버에는
--    없어서, 같은 데이터가 화면마다 다르게 보이고 남의 임시저장 건이 노출됐다.
--  * 판정은 클라이언트가 아니라 여기서 한다 — 이 화면이 작업 목록을 대체하면
--    이 함수가 유일한 관문이 된다.
--  * 하위작업은 따로 거르지 않는다. 부모가 보이면 그 하위도 보인다 — 앱이 늘 부모를
--    통해 하위에 닿는 구조라 목록·상세가 같은 규칙을 쓴다.
--  * 미인증(auth.uid() = null)이면 requester_id 비교가 참이 되지 않아 0건으로 닫힌다.

create or replace function search_task_tree(
  p_page integer default 1,
  p_size integer default 20,
  p_q text default null,
  p_status text[] default null,
  p_assignee_id uuid default null,
  p_sort text default 'createdAt,desc'
) returns jsonb
  language plpgsql stable security invoker set search_path = public
as $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_size integer := least(greatest(coalesce(p_size, 20), 1), 100);
  v_viewer uuid := auth.uid();
  v_sees_all boolean;
  v_visible text;
  v_offset integer;
  v_parts text[];
  v_field text;
  v_dir text;
  v_q text;
  v_status text[];
  v_match_task text;
  v_match_sub text;
  v_where text;
  v_order_task text;
  v_order_sub text;
  v_total integer;
  v_ids text[];
  v_content jsonb;
begin
  v_offset := (v_page - 1) * v_size;

  v_parts := string_to_array(coalesce(p_sort, ''), ',');
  if coalesce(array_length(v_parts, 1), 0) <> 2 then
    raise exception 'sort는 ''필드,방향'' 형식이어야 합니다: %', p_sort using errcode = '22023';
  end if;

  v_field := btrim(v_parts[1]);
  v_dir := lower(btrim(v_parts[2]));

  if v_dir not in ('asc', 'desc') then
    raise exception 'sort 방향이 올바르지 않습니다: %', v_parts[2] using errcode = '22023';
  end if;

  v_order_task := case v_field
    when 'createdAt' then 't.created_at'
    when 'updatedAt' then 't.updated_at'
    when 'key' then 't.task_no'
    when 'title' then 't.title'
    when 'status' then 't.status::text'
  end;

  v_order_sub := case v_field
    when 'createdAt' then 's.created_at'
    when 'updatedAt' then 's.updated_at'
    when 'key' then 's.subtask_no'
    when 'title' then 's.title'
    when 'status' then 's.status::text'
  end;

  if v_order_task is null then
    raise exception 'sort 필드가 올바르지 않습니다: %', v_field using errcode = '22023';
  end if;

  v_order_task := v_order_task || ' ' || v_dir;
  v_order_sub := v_order_sub || ' ' || v_dir;

  v_q := nullif(btrim(coalesce(p_q, '')), '');
  if v_q is not null then
    v_q := replace(replace(replace(v_q, '\', '\'), '%', '\%'), '_', '\_');
  end if;

  v_status := case when coalesce(array_length(p_status, 1), 0) = 0 then null else p_status end;

  -- 역할 계층은 enum 선언 순서(REQUESTER < WORKER < LEAD < ADMIN)와 같아 그대로 비교한다
  select exists (
    select 1 from profiles p where p.id = v_viewer and p.role >= 'WORKER'::user_role
  ) into v_sees_all;

  -- 작업자 이상은 남의 건도 보되 임시저장은 등록자 본인만, 담당자는 자기가 등록한 것만 본다
  v_visible := case
    when v_sees_all then $m$(t.status <> 'DRAFT' or t.requester_id = $4)$m$
    else $m$(t.requester_id = $4)$m$
  end;

  v_match_task := $m$(
    ($1 is null or t.task_no ilike '%' || $1 || '%' escape '\' or t.title ilike '%' || $1 || '%' escape '\')
    and ($2 is null or t.status::text = any($2))
    and ($3 is null or t.requester_id = $3)
  )$m$;

  v_match_sub := $m$(
    ($1 is null or s.subtask_no ilike '%' || $1 || '%' escape '\' or s.title ilike '%' || $1 || '%' escape '\')
    and ($2 is null or s.status::text = any($2))
    and ($3 is null or s.assignee_id = $3)
  )$m$;

  v_where := v_visible || $m$ and ($m$ || v_match_task || $m$ or exists (
    select 1 from subtasks s where s.parent_task_no = t.task_no and $m$ || v_match_sub || '))';

  execute format('select count(*) from tasks t where %s', v_where)
    using v_q, v_status, p_assignee_id, v_viewer
    into v_total;

  execute format($f$
    select coalesce(array_agg(task_no order by rn), '{}'::text[])
    from (
      select t.task_no, row_number() over (order by %s, t.task_no) as rn
      from tasks t
      where %s
    ) ranked
    where rn > %s and rn <= %s
  $f$, v_order_task, v_where, v_offset, v_offset + v_size)
    using v_q, v_status, p_assignee_id, v_viewer
    into v_ids;

  execute format($f$
    with parents as (
      select t.*, array_position($4::text[], t.task_no) as ord
      from tasks t
      where t.task_no = any($4::text[])
    ),
    kids as (
      select s.* from subtasks s where s.parent_task_no = any($4::text[])
    )
    select coalesce(jsonb_agg(node order by ord), '[]'::jsonb)
    from (
      select
        t.ord,
        jsonb_build_object(
          'id', t.task_no,
          'key', t.task_no,
          'title', t.title,
          'status', t.status::text,
          'assigneeId', t.requester_id,
          'assigneeName', rp.name,
          'dueDate', t.due_date,
          'createdAt', t.created_at,
          'updatedAt', t.updated_at,
          'matched', %s,
          'childCount', (select count(*) from kids k where k.parent_task_no = t.task_no),
          'children', (
            select coalesce(jsonb_agg(
              jsonb_build_object(
                'id', s.subtask_no,
                'key', s.subtask_no,
                'parentId', s.parent_task_no,
                'title', s.title,
                'status', s.status::text,
                'assigneeId', s.assignee_id,
                'assigneeName', ap.name,
                'dueDate', s.due_date,
                'createdAt', s.created_at,
                'updatedAt', s.updated_at,
                'matched', %s
              ) order by %s, s.subtask_no
            ), '[]'::jsonb)
            from kids s
            left join profiles ap on ap.id = s.assignee_id
            where s.parent_task_no = t.task_no
          )
        ) as node
      from parents t
      left join profiles rp on rp.id = t.requester_id
    ) nodes
  $f$, v_match_task, v_match_sub, v_order_sub)
    using v_q, v_status, p_assignee_id, v_ids
    into v_content;

  return jsonb_build_object(
    'content', v_content,
    'page', jsonb_build_object(
      'number', v_page,
      'size', v_size,
      'totalParents', v_total,
      'totalPages', ceil(v_total::numeric / v_size)::integer
    )
  );
end;
$$;
