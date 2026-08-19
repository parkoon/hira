import type { StatusHistoryEntry, Task } from '@/features/tasks/api/types'
import { CommentSection } from '@/features/tasks/components/comment-section'
import { TASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { getEnumLabel } from '@/shared/utils/enum'
import { getSubjectParticle } from '@/shared/utils/korean'

function describeEntry(entry: StatusHistoryEntry) {
  if (entry.fromStatus === null) return '작업을 생성함 (임시저장)'
  if (entry.toStatus === 'PENDING_APPROVAL' && entry.fromStatus === 'DRAFT') return '승인을 요청함'
  // 하위작업 생성·결재 승인은 상태를 그대로 두고 사유만 남긴다
  if (entry.fromStatus === entry.toStatus) return '기록을 남김'

  const from = getEnumLabel(TASK_STATUS_META, entry.fromStatus)
  const to = getEnumLabel(TASK_STATUS_META, entry.toStatus)
  return `상태를 변경함 · ${from} → ${to}`
}

function HistoryList({ task }: { task: Task }) {
  return (
    <div className="space-y-3">
      {task.history.map((entry) => (
        <div
          key={entry.id}
          className="flex gap-2.5"
        >
          <NameAvatar name={entry.actorName} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px]">
              <span className="font-semibold">{entry.actorName}</span>
              {`${getSubjectParticle(entry.actorName)} ${describeEntry(entry)}`}
            </p>
            <p className="text-muted-foreground text-[11px]">{entry.occurredAt}</p>
            {/*
              반려만 '사유'다. 하위작업 생성·결재 승인도 같은 칸을 쓰는데, 그것들까지
              빨간 사유로 그리면 문제가 생긴 기록처럼 읽힌다
            */}
            {entry.reason &&
              (entry.toStatus === 'REJECTED' ? (
                <p className="text-destructive text-xs">사유: {entry.reason}</p>
              ) : (
                <p className="text-muted-foreground text-xs break-all">{entry.reason}</p>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 활동 — Jira 이슈 뷰처럼 사람의 대화(댓글)와 시스템 기록(이력)을 탭으로 가른다 */
export function TaskActivity({ task }: { task: Task }) {
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
            owner={{ taskNo: task.taskNo }}
            comments={task.comments}
          />
        </TabsContent>
        <TabsContent value="history">
          <HistoryList task={task} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
