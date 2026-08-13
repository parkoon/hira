import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  StrikethroughIcon,
  UndoIcon,
} from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'

import { EditorLinkPopover } from './editor-link-popover'

type ToolbarAction = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  run: () => void
  isActive?: boolean
  canRun?: boolean
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  // tiptap v3는 트랜잭션마다 리렌더하지 않는다 — 활성/가능 상태를 useEditorState로 구독해야
  // 문서 변경 없이 커서만 움직여도 툴바 표시가 갱신된다
  const state = useEditorState({
    editor,
    selector: (context) => ({
      bold: context.editor.isActive('bold'),
      italic: context.editor.isActive('italic'),
      strike: context.editor.isActive('strike'),
      bulletList: context.editor.isActive('bulletList'),
      orderedList: context.editor.isActive('orderedList'),
      blockquote: context.editor.isActive('blockquote'),
      canUndo: context.editor.can().undo(),
      canRedo: context.editor.can().redo(),
    }),
  })

  const actions: ToolbarAction[] = [
    {
      label: '굵게',
      icon: BoldIcon,
      run: () => editor.chain().focus().toggleBold().run(),
      isActive: state.bold,
    },
    {
      label: '기울임',
      icon: ItalicIcon,
      run: () => editor.chain().focus().toggleItalic().run(),
      isActive: state.italic,
    },
    {
      label: '취소선',
      icon: StrikethroughIcon,
      run: () => editor.chain().focus().toggleStrike().run(),
      isActive: state.strike,
    },
    {
      label: '순서 없는 목록',
      icon: ListIcon,
      run: () => editor.chain().focus().toggleBulletList().run(),
      isActive: state.bulletList,
    },
    {
      label: '순서 있는 목록',
      icon: ListOrderedIcon,
      run: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: state.orderedList,
    },
    {
      label: '인용',
      icon: QuoteIcon,
      run: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: state.blockquote,
    },
  ]

  const historyActions: ToolbarAction[] = [
    {
      label: '실행 취소',
      icon: UndoIcon,
      run: () => editor.chain().focus().undo().run(),
      canRun: state.canUndo,
    },
    {
      label: '다시 실행',
      icon: RedoIcon,
      run: () => editor.chain().focus().redo().run(),
      canRun: state.canRedo,
    },
  ]

  const renderAction = (action: ToolbarAction) => (
    <Button
      key={action.label}
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={action.label}
      aria-pressed={action.isActive}
      disabled={action.canRun === undefined ? false : !action.canRun}
      className={action.isActive ? 'bg-accent text-accent-foreground' : undefined}
      onClick={action.run}
    >
      <action.icon />
    </Button>
  )

  return (
    <div className="border-border bg-muted/50 flex items-center gap-0.5 border-b px-1.5 py-1">
      {actions.map(renderAction)}
      <EditorLinkPopover editor={editor} />
      <Separator
        orientation="vertical"
        className="mx-1 h-4"
      />
      {historyActions.map(renderAction)}
    </div>
  )
}
