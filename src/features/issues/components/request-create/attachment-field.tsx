import { PaperclipIcon, UploadCloudIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import {
  ATTACHMENT_POLICY,
  formatFileSize,
  validateAttachment,
} from '@/features/issues/constants/attachment-policy'
import type { RequestFormValues } from '@/features/issues/utils/request-form-schema'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

const acceptAttribute = ATTACHMENT_POLICY.allowedExtensions.map((ext) => `.${ext}`).join(',')

/** 고른 파일은 폼이 들고 있는다 — 저장 시 이슈와 함께 등록된다 (스펙 §4.2) */
export function AttachmentField() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { control } = useFormContext<RequestFormValues>()
  const { field } = useController({ control, name: 'attachments' })
  const [dragging, setDragging] = useState(false)

  const files = field.value
  const setFiles = field.onChange

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return

    const accepted: File[] = []
    let totalSize = files.reduce((sum, file) => sum + file.size, 0)

    for (const file of incoming) {
      const error = validateAttachment(file, totalSize)
      if (error) {
        toast.error(error)
        continue
      }
      accepted.push(file)
      totalSize += file.size
    }

    if (accepted.length > 0) setFiles([...files, ...accepted])
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          addFiles(event.dataTransfer.files)
        }}
        className={cn(
          'border-input rounded-md border-2 border-dashed p-4 text-center transition-colors',
          dragging && 'border-ring bg-accent/50'
        )}
      >
        <UploadCloudIcon className="text-muted-foreground mx-auto mb-1.5 size-5" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          파일을 끌어다 놓거나 클릭해서 업로드
        </Button>
        <p className="text-muted-foreground mt-1 text-[11px]">
          파일당 50MB · 이슈당 200MB · pdf, docx, xlsx, hwp, 이미지, zip
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptAttribute}
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, index) => (
            <li
              // 같은 파일을 두 번 고르면 이름이 겹친다
              key={`${file.name}-${index}`}
              className="bg-muted/60 flex items-center gap-2 rounded px-2 py-1.5 text-[13px]"
            >
              <PaperclipIcon className="text-muted-foreground size-3.5 shrink-0" />
              <span className="truncate">{file.name}</span>
              <span className="text-muted-foreground ml-auto shrink-0 text-[11px]">
                {formatFileSize(file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`${file.name} 삭제`}
                onClick={() => setFiles(files.filter((_, current) => current !== index))}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
