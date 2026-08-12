import { ExternalLinkIcon, PaperclipIcon } from 'lucide-react'

import type { EvidenceContent } from '@/features/issues/api/types'

/** 기록된 증적 표시 — 부모·하위 증적 카드가 함께 쓴다 (시나리오 각주 3) */
export function EvidenceContentView({ evidence }: { evidence: EvidenceContent }) {
  return (
    <div className="text-muted-foreground space-y-0.5 text-xs">
      {evidence.links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 items-center gap-1 text-blue-700 hover:underline dark:text-blue-400"
        >
          <span className="truncate">{link.label || link.url}</span>
          <ExternalLinkIcon className="size-3 shrink-0" />
        </a>
      ))}

      {evidence.attachments.map((attachment) => (
        <p
          key={attachment.fileName}
          className="flex min-w-0 items-center gap-1"
        >
          <PaperclipIcon className="size-3 shrink-0" />
          <span className="truncate">{attachment.fileName}</span>
        </p>
      ))}

      {evidence.memo.trim().length > 0 && <p className="whitespace-pre-line">{evidence.memo}</p>}
    </div>
  )
}
