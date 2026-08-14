import { FileArchiveIcon, FileIcon, FileImageIcon, FileTextIcon } from 'lucide-react'

import type { Attachment, Task } from '@/features/tasks/api/types'
import { formatFileSize, getFileExtension } from '@/features/tasks/constants/attachment-policy'

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif']
const DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'pptx', 'hwp', 'hwpx', 'txt', 'csv']

/** 미리보기 이미지가 없으므로 확장자 계열로 아이콘을 고른다 (스펙 §4.2) */
function AttachmentIcon({ fileName }: { fileName: string }) {
  const extension = getFileExtension(fileName)

  if (IMAGE_EXTENSIONS.includes(extension)) return <FileImageIcon className="size-6" />
  if (DOCUMENT_EXTENSIONS.includes(extension)) return <FileTextIcon className="size-6" />
  if (extension === 'zip') return <FileArchiveIcon className="size-6" />
  return <FileIcon className="size-6" />
}

function AttachmentTile({ attachment }: { attachment: Attachment }) {
  return (
    <div className="bg-muted w-56 overflow-hidden rounded-lg">
      <div className="text-muted-foreground flex h-20 items-center justify-center">
        <AttachmentIcon fileName={attachment.fileName} />
      </div>
      <div className="space-y-0.5 px-3 pb-2.5">
        <p
          className="truncate text-[13px] font-medium"
          title={attachment.fileName}
        >
          {attachment.fileName}
        </p>
        <p className="text-muted-foreground text-[11px]">{formatFileSize(attachment.size)}</p>
      </div>
    </div>
  )
}

/** 화면 6 — 첨부 (스펙 §4.2). 다운로드는 백엔드 연동 후 붙인다 */
export function TaskAttachments({ task }: { task: Task }) {
  if (task.attachments.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">첨부</h2>
      <ul className="flex flex-wrap gap-3">
        {/* 키는 id다 — 같은 이름이 여러 번 붙을 수 있어 이름은 키가 되지 못한다 */}
        {task.attachments.map((attachment) => (
          <li key={attachment.id}>
            <AttachmentTile attachment={attachment} />
          </li>
        ))}
      </ul>
    </section>
  )
}
