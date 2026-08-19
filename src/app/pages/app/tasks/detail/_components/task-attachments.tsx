import { DownloadIcon, FileArchiveIcon, FileIcon, FileImageIcon, FileTextIcon } from 'lucide-react'

import { useDownloadAttachmentMutation } from '@/features/tasks/api/download-attachment'
import type { Attachment, Task } from '@/features/tasks/api/types'
import { formatFileSize, getFileExtension } from '@/features/tasks/constants/attachment-policy'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/utils/cn'

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

function AttachmentTile({
  attachment,
  pending,
  onDownload,
}: {
  attachment: Attachment
  pending: boolean
  onDownload: () => void
}) {
  const downloadable = attachment.storagePath !== null

  const tile = (
    <button
      type="button"
      disabled={!downloadable || pending}
      onClick={onDownload}
      className={cn(
        'group/tile bg-muted w-56 overflow-hidden rounded-lg text-left',
        downloadable && 'hover:ring-ring/60 transition-shadow hover:ring-2',
        !downloadable && 'cursor-default'
      )}
    >
      <div className="text-muted-foreground relative flex h-20 items-center justify-center">
        <AttachmentIcon fileName={attachment.fileName} />
        {/* Jira처럼 짚었을 때만 다운로드 신호를 드러낸다 */}
        {downloadable && (
          <span className="bg-background/90 text-foreground absolute top-1.5 right-1.5 rounded p-1 opacity-0 shadow-sm transition-opacity group-hover/tile:opacity-100">
            <DownloadIcon className="size-3.5" />
          </span>
        )}
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
    </button>
  )

  if (downloadable) return tile

  return (
    <Tooltip>
      <TooltipTrigger asChild>{tile}</TooltipTrigger>
      <TooltipContent>본문이 보관되지 않은 데모 첨부라 내려받을 수 없어요</TooltipContent>
    </Tooltip>
  )
}

/** 화면 6 — 첨부 (스펙 §4.2). 타일을 누르면 내려받고 감사 로그가 남는다 */
export function TaskAttachments({ task }: { task: Task }) {
  const { user } = useCurrentUser()
  const downloadAttachment = useDownloadAttachmentMutation()

  if (task.attachments.length === 0) return null

  const handleDownload = (attachment: Attachment) => {
    downloadAttachment.mutate(
      { taskNo: task.taskNo, attachment, actorName: user.name },
      {
        onSuccess: (signedUrl) => {
          // 서명 URL이 첨부 처리를 강제하므로 앵커 클릭이 곧 내려받기다 (CSV 내보내기와 같은 방식)
          const link = document.createElement('a')
          link.href = signedUrl
          link.click()
        },
      }
    )
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">첨부</h2>
      <ul className="flex flex-wrap gap-3">
        {/* 키는 id다 — 같은 이름이 여러 번 붙을 수 있어 이름은 키가 되지 못한다 */}
        {task.attachments.map((attachment) => (
          <li key={attachment.id}>
            <AttachmentTile
              attachment={attachment}
              pending={downloadAttachment.isPending}
              onDownload={() => handleDownload(attachment)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
