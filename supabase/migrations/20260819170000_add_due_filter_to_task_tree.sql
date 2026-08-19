-- 계층 조회에 목표일 퀵 필터(p_due)를 더한다.
--
--  * 'overdue'는 진행 중인데 목표일이 지난 행, 'soon'은 오늘부터 7일 안에 닥치는 행이다.
--    상태·담당자 필터처럼 행 단위 매칭 조건이라, 걸린 하위 덕에 문맥으로 딸려온
--    상위는 똑같이 흐리게 표시된다.
--  * 목표일 없는 하위작업은 어느 쪽에도 걸리지 않고, 끝난 행의 지난 날짜는 지연이 아니다.
--  * 나머지는 20260819160000 그대로다.

-- 파라미터가 늘면 replace가 아니라 오버로드가 된다 — 옛 시그니처가 남으면
-- PostgREST가 어느 쪽을 부를지 몰라 모호성 에러를 낸다. 지우고 다시 만든다.
drop function if exists search_task_tree(integer, integer, text, text[], uuid, text);

create or replace function search_task_tree(
  p_page integer default 1,
  p_size integer default 20,
  p_q text default null,
  p_status text[] default null,
  p_assignee_id uuid default null,
  p_sort text default 'createdAt,desc',
  p_due text default null
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

  if p_due is not null and p_due not in ('overdue', 'soon') then
    raise exception 'due 필터가 올바르지 않습니다: %', p_due using errcode = '22023';
  end if;

  v_order_task := case v_field
    when 'createdAt' then 't.created_at'
    when 'updatedAt' then 't.updated_at'
    when 'dueDate' then 't.due_date'
    when 'priority' then 't.priority'
    when 'key' then 't.task_no'
    when 'title' then 't.title'
    when 'status' then 't.status::text'
  end;

  v_order_sub := case v_field
    when 'createdAt' then 's.created_at'
    when 'updatedAt' then 's.updated_at'
    when 'dueDate' then 's.due_date'
    -- 하위작업에는 우선순위가 없다 — 그룹 안에서는 번호순을 유지한다
    when 'priority' then 's.subtask_no'
    when 'key' then 's.subtask_no'
    when 'title' then 's.title'
    when 'status' then 's.status::text'
  end;

  if v_order_task is null then
    raise exception 'sort 필드가 올바르지 않습니다: %', v_field using errcode = '22023';
  end if;

  v_order_task := v_order_task || ' ' || v_dir || ' nulls last';
  v_order_sub := v_order_sub || ' ' || v_dir || ' nulls last';

  v_q := nullif(btrim(coalesce(p_q, '')), '');
  if v_q is not null then
    v_q := replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_');
  end if;

  v_status := case when coalesce(array_length(p_status, 1), 0) = 0 then null else p_status end;

  select exists (
    select 1 from profiles p where p.id = v_viewer and p.role >= 'WORKER'::user_role
  ) into v_sees_all;

  v_visible := case
    when v_sees_all then $m$(t.status <> 'DRAFT' or t.requester_id = $4)$m$
    else $m$(t.requester_id = $4)$m$
  end;

  v_match_task := $m$(
    ($1 is null or t.task_no ilike '%' || $1 || '%' escape '\' or t.title ilike '%' || $1 || '%' escape '\')
    and ($2 is null or t.status::text = any($2))
    and ($3 is null or t.requester_id = $3)
    and ($5 is null
      or ($5 = 'overdue' and t.status::text <> 'DONE' and t.due_date < current_date)
      or ($5 = 'soon' and t.status::text <> 'DONE'
        and t.due_date >= current_date and t.due_date < current_date + 7))
  )$m$;

  v_match_sub := $m$(
    ($1 is null or s.subtask_no ilike '%' || $1 || '%' escape '\' or s.title ilike '%' || $1 || '%' escape '\')
    and ($2 is null or s.status::text = any($2))
    and ($3 is null or s.assignee_id = $3)
    and ($5 is null
      or ($5 = 'overdue' and s.status::text <> 'DONE' and s.due_date < current_date)
      or ($5 = 'soon' and s.status::text <> 'DONE'
        and s.due_date >= current_date and s.due_date < current_date + 7))
  )$m$;

  v_where := v_visible || $m$ and ($m$ || v_match_task || $m$ or exists (
    select 1 from subtasks s where s.parent_task_no = t.task_no and $m$ || v_match_sub || '))';

  execute format('select count(*) from tasks t where %s', v_where)
    using v_q, v_status, p_assignee_id, v_viewer, p_due
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
    using v_q, v_status, p_assignee_id, v_viewer, p_due
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
          'priority', t.priority::text,
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
    using v_q, v_status, p_assignee_id, v_ids, p_due
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
