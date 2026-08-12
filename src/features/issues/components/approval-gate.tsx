import { CheckIcon } from 'lucide-react'

import type { Approval, ApprovalKind } from '@/features/issues/api/types'
import { PanelCardField } from '@/features/issues/components/panel-card'
import { APPROVAL_KIND_META } from '@/features/issues/constants/metadata'
import { Button } from '@/shared/components/ui/button'
import { Lozenge } from '@/shared/components/ui/lozenge'

type ApprovalGateProps = {
  /** 결재자가 무엇을 봐야 하는지 — DBA 검증은 요청 내용이 여기 들어간다 (시나리오 8) */
  description?: string | null
  required: ApprovalKind[]
  approvals: Approval[]
  onApprove: (kind: ApprovalKind) => void
}

/**
 * 결재 진행 상태와 임시 승인 버튼 (시나리오 각주 2).
 * 실제 결재선이 붙기 전까지는 이 버튼이 결재 OK를 대신한다.
 * 제목은 감싸는 PanelCard가 갖는다 — Jira 이슈 뷰의 Issue context 카드 자리.
 */
export function ApprovalGate({ description, required, approvals, onApprove }: ApprovalGateProps) {
  return (
    <>
      {/* 읽는 글이라 면을 깔지 않는다. 폭이 좁아 라벨을 위에 얹고 본문을 아래로 흘린다 */}
      {description && (
        <div className="space-y-1 pb-2.5">
          <p className="text-muted-foreground text-[13px] font-medium">검증 요청</p>
          <p className="text-[13px] whitespace-pre-line">{description}</p>
        </div>
      )}

      {required.map((kind) => {
        const approval = approvals.find((item) => item.kind === kind)

        return (
          <PanelCardField
            key={kind}
            label={APPROVAL_KIND_META[kind].label}
          >
            {approval ? (
              <span className="flex flex-wrap items-center gap-1.5">
                <Lozenge tone="success">승인</Lozenge>
                <span className="text-muted-foreground text-[11px]">
                  {approval.approvedBy} · {approval.approvedAt}
                </span>
              </span>
            ) : (
              <span className="flex flex-wrap items-center gap-1.5">
                <Lozenge tone="warning">대기</Lozenge>
                {/* 결재선 연동 전 임시 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove(kind)}
                >
                  <CheckIcon />
                  임시 승인
                </Button>
              </span>
            )}
          </PanelCardField>
        )
      })}
    </>
  )
}
