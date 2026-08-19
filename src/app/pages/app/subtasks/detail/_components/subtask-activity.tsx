import type { StatusHistoryEntry, Subtask } from '@/features/tasks/api/types'
import { CommentSection } from '@/features/tasks/components/comment-section'
import { SUBTASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { Lozenge } from '@/shared/components/ui/lozenge'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { getEnumLabel } from '@/shared/utils/enum'
import { getSubjectParticle } from '@/shared/utils/korean'

/** 제목·설명·목표일 수정은 상태를 그대로 두고 내용만 남긴다 */
function isEdit(entry: StatusHistoryEntry) {
  return entry.fromStatus === entry.toStatus
}

function describeEntry(entry: StatusHistoryEntry) {
  if (entry.fromStatus === null) return '하위작업을 생성함'
  if (isEdit(entry)) return '하위작업을 수정함'

  const from = getEnumLabel(SUBTASK_STATUS_META, entry.fromStatus)
  const to = getEnumLabel(SUBTASK_STATUS_META, entry.toStatus)
  return `상태를 변경함 · ${from} → ${to}`
}

function HistoryList({ subtask }: { subtask: Subtask }) {
  return (
    <div className="space-y-3">
      {/* 생성 직후에는 이력이 없다. 칸이 통째로 비면 깨진 것처럼 보여 안내만 둔다 */}
      {subtask.history.length === 0 && (
        <p className="text-muted-foreground text-[13px]">
          아직 활동이 없습니다. 단계를 전이하면 여기에 기록됩니다.
        </p>
      )}

      {subtask.history.map((entry) => (
        <div
          key={entry.id}
          className="flex gap-2.5"
        >
          <NameAvatar name={entry.actorName} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5 text-[13px]">
              <span>
                <span className="font-semibold">{entry.actorName}</span>
                {`${getSubjectParticle(entry.actorName)} ${describeEntry(entry)}`}
              </span>
              {/* 수동이 기본이므로 API 전이일 때만 배지를 붙인다 (스펙 §5.3) */}
              {entry.via === 'API' && <Lozenge tone="info">자동</Lozenge>}
            </p>
            <p className="text-muted-foreground text-[11px]">{entry.occurredAt}</p>
            {/* 수정 기록의 내용은 '사유'가 아니다 — 무엇이 바뀌었는지를 그대로 적는다 */}
            {entry.reason && (
              <p className="text-muted-foreground text-xs break-all">
                {isEdit(entry) ? entry.reason : `사유: ${entry.reason}`}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 활동 — Jira 이슈 뷰처럼 사람의 대화(댓글)와 시스템 기록(이력)을 탭으로 가른다 */
export function SubtaskActivity({ subtask }: { subtask: Subtask }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">활동</h2>

      <Tabs defaultValue="comments">
        <TabsList>
          <TabsTrigger value="comments">댓글</TabsTrigger>
          <TabsTrigger value="history">이력</TabsTrigger>
        </TabsList>
        <TabsContent value="comments">
          <CommentSection
            owner={{ subtaskNo: subtask.subtaskNo }}
            comments={subtask.comments}
          />
        </TabsContent>
        <TabsContent value="history">
          <HistoryList subtask={subtask} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
