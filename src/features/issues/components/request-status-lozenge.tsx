import type { RequestStatus } from '@/features/issues/api/types'
import { REQUEST_STATUS_META } from '@/features/issues/constants/metadata'
import { Lozenge } from '@/shared/components/ui/lozenge'

export function RequestStatusLozenge({ status }: { status: RequestStatus }) {
  const meta = REQUEST_STATUS_META[status]
  return <Lozenge tone={meta.tone}>{meta.label}</Lozenge>
}
