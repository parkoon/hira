import { PaperclipIcon, PlusIcon, XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import type { EvidenceContent } from '@/features/tasks/api/types'
import { ATTACHMENT_POLICY, validateAttachment } from '@/features/tasks/constants/attachment-policy'
import { hasEvidenceContent } from '@/features/tasks/constants/transition-evidence'
import { Button } from '@/shared/components/ui/button'
import { Field, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/textarea'

const acceptAttribute = ATTACHMENT_POLICY.allowedExtensions.map((ext) => `.${ext}`).join(',')

const EMPTY_EVIDENCE: EvidenceContent = {
  links: [{ url: '' }],
  attachments: [],
  memo: '',
}

type TransitionEvidenceDialogProps = {
  open: boolean
  title: string
  /** 이 단계에서 무엇을 남겨야 하는지 */
  hint: string
  /** 확인하면 어떤 상태가 되는지 — 증적 팝업이 확인 팝업을 겸한다 (시나리오 각주 1) */
  outcome?: string
  confirmLabel: string
  /** 3종 위에 덧붙는 단계 전용 입력 (개발 완료의 DBA 검증 체크) */
  children?: React.ReactNode
  /** 확인 버튼을 추가로 막을 조건 — children이 미완성일 때 */
  confirmDisabled?: boolean
  /** 정정 시 기존 값을 채워 연다. 값이 바뀌면 호출 측에서 `key`로 리마운트한다 */
  initialValues?: EvidenceContent
  onOpenChange: (open: boolean) => void
  /**
   * 확인 후 닫는 것은 호출 측 몫이다 — 저장이 실패했는데 닫히면
   * 입력한 링크·메모를 되찾을 길이 없다 (`task-form-modal`과 같은 규칙)
   */
  onConfirm: (evidence: EvidenceContent) => void
}

/** 단계 완료·정정 시 증적을 받는 공용 다이얼로그 (시나리오 각주 3) */
export function TransitionEvidenceDialog({
  open,
  title,
  hint,
  outcome,
  confirmLabel,
  children,
  confirmDisabled = false,
  initialValues,
  onOpenChange,
  onConfirm,
}: TransitionEvidenceDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [evidence, setEvidence] = useState<EvidenceContent>(() =>
    initialValues
      ? {
          ...initialValues,
          links: initialValues.links.length > 0 ? initialValues.links : EMPTY_EVIDENCE.links,
        }
      : EMPTY_EVIDENCE
  )

  const setLinkUrl = (index: number, url: string) =>
    setEvidence((previous) => ({
      ...previous,
      links: previous.links.map((link, current) => (current === index ? { url } : link)),
    }))

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return

    const accepted: EvidenceContent['attachments'] = []
    let totalSize = evidence.attachments.reduce((sum, item) => sum + item.size, 0)

    for (const file of fileList) {
      const error = validateAttachment(file, totalSize)
      if (error) {
        toast.error(error)
        continue
      }
      accepted.push({ fileName: file.name, size: file.size })
      totalSize += file.size
    }

    if (accepted.length === 0) return
    setEvidence((previous) => ({
      ...previous,
      attachments: [...previous.attachments, ...accepted],
    }))
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={outcome ? `${hint} 확인하면 ${outcome}(으)로 바뀝니다.` : hint}
      className="h-auto max-h-[calc(100dvh-2rem)] sm:max-w-lg"
      expandable={false}
      secondaryAction={{ label: '취소', onClick: () => onOpenChange(false) }}
      primaryAction={{
        label: confirmLabel,
        disabled: confirmDisabled || !hasEvidenceContent(evidence),
        onClick: () =>
          // 빈 링크 칸은 저장하지 않는다
          onConfirm({
            ...evidence,
            links: evidence.links.filter((link) => link.url.trim().length > 0),
          }),
      }}
    >
      <div className="space-y-4">
        {children}

        <Field>
          <FieldLabel htmlFor="evidence-link-0">링크</FieldLabel>
          <div className="space-y-1.5">
            {evidence.links.map((link, index) => (
              <div
                key={index}
                className="flex items-center gap-1"
              >
                <Input
                  id={`evidence-link-${index}`}
                  autoFocus={index === 0}
                  value={link.url}
                  placeholder="https://wiki.example.com/..."
                  aria-label={`링크 ${index + 1}`}
                  onChange={(event) => setLinkUrl(index, event.target.value)}
                />
                {evidence.links.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`링크 ${index + 1} 삭제`}
                    onClick={() =>
                      setEvidence((previous) => ({
                        ...previous,
                        links: previous.links.filter((_, current) => current !== index),
                      }))
                    }
                  >
                    <XIcon />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setEvidence((previous) => ({
                  ...previous,
                  links: [...previous.links, { url: '' }],
                }))
              }
            >
              <PlusIcon />
              링크 추가
            </Button>
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="evidence-attach">첨부파일</FieldLabel>
          <div className="space-y-1.5">
            {evidence.attachments.map((attachment, index) => (
              <div
                key={`${attachment.fileName}-${index}`}
                className="flex items-center gap-1 text-[13px]"
              >
                <PaperclipIcon className="text-muted-foreground size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${attachment.fileName} 삭제`}
                  onClick={() =>
                    setEvidence((previous) => ({
                      ...previous,
                      attachments: previous.attachments.filter((_, current) => current !== index),
                    }))
                  }
                >
                  <XIcon />
                </Button>
              </div>
            ))}
            <Button
              id="evidence-attach"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <PaperclipIcon />
              파일 선택
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptAttribute}
              className="hidden"
              onChange={(event) => {
                handleFiles(event.target.files)
                event.target.value = ''
              }}
            />
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="evidence-memo">메모</FieldLabel>
          <Textarea
            id="evidence-memo"
            rows={3}
            value={evidence.memo}
            onChange={(event) =>
              setEvidence((previous) => ({ ...previous, memo: event.target.value }))
            }
          />
        </Field>
      </div>
    </Modal>
  )
}
