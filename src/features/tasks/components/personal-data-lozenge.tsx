import { LockIcon } from 'lucide-react'

import { Lozenge } from '@/shared/components/ui/lozenge'

/** 개인정보 취급 신고 건 강조 배지 — 승인 화면에서 리드에게 강조 표시 (스펙 §4.1) */
export function PersonalDataLozenge({ withIcon = false }: { withIcon?: boolean }) {
  return (
    <Lozenge tone="danger">
      {withIcon && <LockIcon />}
      개인정보{withIcon && ' 취급'}
    </Lozenge>
  )
}
