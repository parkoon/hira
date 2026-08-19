import { useState } from 'react'

import { useCreateCommentMutation } from '@/features/tasks/api/create-comment'
import { useDeleteCommentMutation } from '@/features/tasks/api/delete-comment'
import type { Comment } from '@/features/tasks/api/types'
import { useUpdateCommentMutation } from '@/features/tasks/api/update-comment'
import type { ActivityOwner } from '@/features/tasks/api/writers'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Button } from '@/shared/components/ui/button'
import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { Textarea } from '@/shared/components/ui/textarea'
import { useConfirm } from '@/shared/hooks/use-confirm'

type CommentSectionProps = {
  owner: ActivityOwner
  comments: Comment[]
}

/**
 * 댓글 입력과 목록 (Jira 이슈 뷰의 Comments).
 * 입력은 목록 위에 둔다 — 접혀 있다가 짚으면 펼쳐지고, 목록은 최신이 위다.
 * 성공 토스트는 띄우지 않는다 — 댓글이 목록에 나타나는 것이 곧 피드백이다.
 */
export function CommentSection({ owner, comments }: CommentSectionProps) {
  const { user } = useCurrentUser()
  const confirm = useConfirm()
  const createComment = useCreateCommentMutation()
  const updateComment = useUpdateCommentMutation()
  const deleteComment = useDeleteCommentMutation()

  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const handleCreate = () => {
    createComment.mutate(
      { owner, body: draft.trim(), authorId: user.id },
      {
        onSuccess: () => {
          setDraft('')
          setComposing(false)
        },
      }
    )
  }

  const handleUpdate = (id: number) => {
    updateComment.mutate(
      { id, body: editDraft.trim(), authorId: user.id },
      { onSuccess: () => setEditingId(null) }
    )
  }

  const handleDelete = async (id: number) => {
    const confirmed = await confirm.open({
      title: '댓글 삭제',
      description: '삭제한 댓글은 복구할 수 없습니다.',
      confirm: { text: '삭제', variant: 'destructive' },
    })
    if (!confirmed) return

    deleteComment.mutate({ id, authorId: user.id })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2.5">
        <NameAvatar name={user.name} />
        {composing ? (
          <div className="min-w-0 flex-1 space-y-2">
            <Textarea
              autoFocus
              rows={3}
              value={draft}
              placeholder="댓글 달기…"
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                disabled={draft.trim().length === 0 || createComment.isPending}
                onClick={handleCreate}
              >
                저장
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setComposing(false)
                  setDraft('')
                }}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          // Jira처럼 인풋 모양으로 접어 둔다 — 짚기 전에는 자리만 차지한다
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="border-input text-muted-foreground hover:bg-muted/50 min-w-0 flex-1 rounded-md border px-3 py-1.5 text-left text-[13px] transition-colors"
          >
            댓글 달기…
          </button>
        )}
      </div>

      <div className="space-y-3">
        {comments.map((comment) => {
          const mine = comment.author.id === user.id
          const editing = editingId === comment.id

          return (
            <div
              key={comment.id}
              className="flex gap-2.5"
            >
              <NameAvatar name={comment.author.name} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[13px]">
                  <span className="font-semibold">{comment.author.name}</span>
                  <span className="text-muted-foreground ml-1.5 text-[11px]">
                    {comment.createdAt}
                    {comment.edited && ' (수정됨)'}
                  </span>
                </p>

                {editing ? (
                  <div className="space-y-2 pt-1">
                    <Textarea
                      autoFocus
                      rows={3}
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                    />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        disabled={editDraft.trim().length === 0 || updateComment.isPending}
                        onClick={() => handleUpdate(comment.id)}
                      >
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] break-words whitespace-pre-wrap">{comment.body}</p>
                    {/* Jira처럼 본인 댓글에만 낮은 톤의 텍스트 링크를 붙인다 */}
                    {mine && (
                      <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                        <button
                          type="button"
                          className="hover:text-foreground hover:underline"
                          onClick={() => {
                            setEditingId(comment.id)
                            setEditDraft(comment.body)
                          }}
                        >
                          수정
                        </button>
                        <span aria-hidden>·</span>
                        <button
                          type="button"
                          className="hover:text-foreground hover:underline"
                          onClick={() => void handleDelete(comment.id)}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
