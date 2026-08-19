import Mention from '@tiptap/extension-mention'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'

import {
  createMentionSuggestion,
  type MentionCandidate,
} from '@/features/tasks/components/mention-suggestion'
import { cn } from '@/shared/utils/cn'

import { EditorToolbar } from './editor-toolbar'

const EDITOR_CONTENT_CLASS = cn(
  'min-h-32 px-3 py-2.5 text-sm outline-none',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5',
  '[&_blockquote]:text-muted-foreground [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_p]:my-1',
  '[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]',
  // 멘션 칩 — 본문 렌더(CommentBody)와 같은 모양이어야 쓰는 동안 결과를 예측할 수 있다
  '[&_[data-type=mention]]:bg-primary/10 [&_[data-type=mention]]:text-primary [&_[data-type=mention]]:rounded [&_[data-type=mention]]:px-1 [&_[data-type=mention]]:py-0.5 [&_[data-type=mention]]:text-[0.9em] [&_[data-type=mention]]:font-medium'
)

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  /** 지정하면 @로 구성원을 언급할 수 있다 — 댓글 에디터가 쓴다 */
  mentionCandidates?: MentionCandidate[]
  /** Ctrl/⌘+Enter 제출 — 댓글처럼 짧은 입력이 반복되는 곳에서 넘긴다 */
  onSubmit?: () => void
}

/** 상세내용 리치텍스트 에디터 — Tiptap (스펙 §4.1) */
export function RichTextEditor({
  value,
  onChange,
  mentionCandidates,
  onSubmit,
}: RichTextEditorProps) {
  // 에디터는 한 번만 만들어진다 — 최신 콜백은 ref로 따라간다
  const onSubmitRef = useRef(onSubmit)
  useEffect(() => {
    onSubmitRef.current = onSubmit
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      ...(mentionCandidates
        ? [
            Mention.configure({
              suggestion: createMentionSuggestion(mentionCandidates),
              // @라벨을 지울 때 통째로 지우지 않고 @만 남긴다 — 다시 고르기가 쉽다
              deleteTriggerWithBackspace: true,
            }),
          ]
        : []),
    ],
    content: value,
    editorProps: {
      attributes: { class: EDITOR_CONTENT_CLASS },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && onSubmitRef.current) {
          onSubmitRef.current()
          return true
        }
        return false
      },
    },
    // isEmpty는 공백만 있는 문단도 내용으로 치므로, 텍스트 기준으로 빈 값을 판정해
    // 공백 상세내용이 필수 검증을 통과하지 못하게 한다
    onUpdate: ({ editor }) => onChange(editor.getText().trim() ? editor.getHTML() : ''),
  })

  if (!editor) return null

  return (
    <div className="border-input bg-background focus-within:border-ring focus-within:ring-ring/50 overflow-hidden rounded-md border focus-within:ring-[3px]">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
