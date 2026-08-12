import type { Editor } from '@tiptap/react'
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
  isActive?: () => boolean
  canRun?: () => boolean
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const actions: ToolbarAction[] = [
    {
      label: '굵게',
      icon: BoldIcon,
      run: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      label: '기울임',
      icon: ItalicIcon,
      run: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      label: '취소선',
      icon: StrikethroughIcon,
      run: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
    {
      label: '순서 없는 목록',
      icon: ListIcon,
      run: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      label: '순서 있는 목록',
      icon: ListOrderedIcon,
      run: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
    {
      label: '인용',
      icon: QuoteIcon,
      run: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive('blockquote'),
    },
  ]

  const historyActions: ToolbarAction[] = [
    {
      label: '실행 취소',
      icon: UndoIcon,
      run: () => editor.chain().focus().undo().run(),
      canRun: () => editor.can().undo(),
    },
    {
      label: '다시 실행',
      icon: RedoIcon,
      run: () => editor.chain().focus().redo().run(),
      canRun: () => editor.can().redo(),
    },
  ]

  const renderAction = (action: ToolbarAction) => (
    <Button
      key={action.label}
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={action.label}
      aria-pressed={action.isActive?.()}
      disabled={action.canRun ? !action.canRun() : false}
      className={action.isActive?.() ? 'bg-accent text-accent-foreground' : undefined}
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
