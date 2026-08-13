import { PaperclipIcon } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

import type { Request } from '@/features/issues/api/types'
import {
  ATTACHMENT_POLICY,
  validateAttachment,
} from '@/features/issues/constants/attachment-policy'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

const acceptAttribute = ATTACHMENT_POLICY.allowedExtensions.map((ext) => `.${ext}`).join(',')

/**
 * 승인(작업중 전이) 이후에는 첨부를 수정할 수 없다 (스펙 §11.2).
 * 제출 후 검토 중(요청승인대기중)에도 내용 변경은 회수 후에만 가능하다 (§3.4).
 */
function getAttachState(request: Request) {
  if (request.status === 'PENDING_APPROVAL') {
    return { enabled: false, reason: '검토 중에는 첨부할 수 없어요. 회수 후 수정하세요' }
  }
  if (request.status !== 'DRAFT' && request.status !== 'REJECTED') {
    return { enabled: false, reason: '승인 이후에는 첨부를 수정할 수 없어요' }
  }
  return { enabled: true, reason: null }
}

type AttachFileButtonProps = {
  request: Request
  onAttach: (files: File[]) => void
}

export function AttachFileButton({ request, onAttach }: AttachFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const attachState = getAttachState(request)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return

    const accepted: File[] = []
    let totalSize = request.attachments.reduce((sum, item) => sum + item.size, 0)

    for (const file of fileList) {
      const error = validateAttachment(file, totalSize)
      if (error) {
        toast.error(error)
        continue
      }
      accepted.push(file)
      totalSize += file.size
    }

    if (accepted.length === 0) return
    // 성공 토스트는 호출 측 mutation onSuccess가 띄운다 — 저장 실패가 성공처럼 보이면 안 된다
    onAttach(accepted)
  }

  return (
    <>
      {/* Jira quick-add처럼 아이콘만 — 이름은 툴팁이 알려준다 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button
              variant="outline"
              size="icon"
              aria-label="파일 첨부"
              disabled={!attachState.enabled}
              onClick={() => inputRef.current?.click()}
            >
              <PaperclipIcon />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{attachState.reason ?? '파일 첨부'}</TooltipContent>
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptAttribute}
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </>
  )
}
