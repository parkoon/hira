import { supabase } from '@/shared/lib/supabase'

/**
 * 인앱 알림 기록 헬퍼 — 여러 도메인의 뮤테이션이 남기므로 `audit-log.ts`처럼 여기 둔다
 * (도메인끼리 서로를 import하지 않게 하려는 것). 조회·표시는 `features/notifications/`가 맡는다.
 */
export type NotificationInput = {
  /** 받는 사람 profiles.id — 빈 값이면 버린다 (담당자 미지정 등) */
  recipientId: string
  actorName: string
  /** 행위 서술 — 화면이 "{actorName}가 {message}"로 잇는다 */
  message: string
  /** 눌렀을 때 이동할 작업. 하위작업 알림도 부모 번호를 여기 담는다 */
  taskNo?: string | null
  /** 있으면 하위작업 상세로 이동한다 */
  subtaskNo?: string | null
}

/**
 * 업무 동작이 끝난 뒤 곁다리로 붙는 기록이라, 여기서 실패해도 동작을 되돌리지 않는다
 * (감사 로그와 같은 원칙). 본인이 한 일은 본인에게 알리지 않는다 — 호출한 뮤테이션이
 * 행위자 id를 들고 있지 않아, 세션에서 읽어 여기서 한 번에 거른다.
 */
export async function pushNotification(
  entries: NotificationInput | NotificationInput[]
): Promise<void> {
  const list = Array.isArray(entries) ? entries : [entries]
  if (list.length === 0) return

  const { data } = await supabase.auth.getSession()
  const selfId = data.session?.user.id

  const rows = list
    .filter((entry) => entry.recipientId.length > 0 && entry.recipientId !== selfId)
    .map((entry) => ({
      recipient_id: entry.recipientId,
      actor_name: entry.actorName,
      message: entry.message,
      task_no: entry.taskNo ?? null,
      subtask_no: entry.subtaskNo ?? null,
    }))
  if (rows.length === 0) return

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) console.error('알림을 남기지 못했습니다', error)
}
