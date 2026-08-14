import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { cn } from '@/shared/utils/cn'

import { EditorToolbar } from './editor-toolbar'

const EDITOR_CONTENT_CLASS = cn(
  'min-h-32 px-3 py-2.5 text-sm outline-none',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5',
  '[&_blockquote]:text-muted-foreground [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_p]:my-1',
  '[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]'
)

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
}

/** 상세내용 리치텍스트 에디터 — Tiptap (스펙 §4.1) */
export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: { attributes: { class: EDITOR_CONTENT_CLASS } },
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
