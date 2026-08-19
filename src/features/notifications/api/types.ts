/**
 * 앱 레이어가 쓰는 도메인 DTO 타입.
 * DB enum·row와의 정합성은 `@/shared/types/database`(Supabase 생성 타입)가 기준이다.
 */

/** DOM의 Notification과 이름이 겹쳐 App을 붙인다 */
export type AppNotification = {
  id: number
  actorName: string
  /** 행위 서술 — 화면이 "{actorName}가 {message}"로 잇는다 */
  message: string
  read: boolean
  createdAt: string
  /** 눌렀을 때 이동할 곳. 대상 레코드가 지워진 알림은 이동할 곳이 없다 */
  href: string | null
}
