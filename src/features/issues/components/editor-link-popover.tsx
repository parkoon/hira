import type { Editor } from '@tiptap/react'
import { LinkIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'

export function EditorLinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')

  const isActive = editor.isActive('link')

  const applyLink = () => {
    if (url.trim().length === 0) {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url.trim() }).run()
    }
    setUrl('')
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setUrl(String(editor.getAttributes('link').href ?? ''))
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="링크"
          aria-pressed={isActive}
          className={isActive ? 'bg-accent text-accent-foreground' : undefined}
        >
          <LinkIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex w-72 gap-2 p-2"
      >
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && applyLink()}
          placeholder="https://wiki.example.com/..."
          aria-label="링크 주소"
        />
        <Button
          type="button"
          size="sm"
          onClick={applyLink}
        >
          적용
        </Button>
      </PopoverContent>
    </Popover>
  )
}
