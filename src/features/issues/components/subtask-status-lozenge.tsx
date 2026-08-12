import type { SubtaskStatus } from '@/features/issues/api/types'
import { SUBTASK_STATUS_META } from '@/features/issues/constants/metadata'
import { Lozenge } from '@/shared/components/ui/lozenge'

export function SubtaskStatusLozenge({ status }: { status: SubtaskStatus }) {
  const meta = SUBTASK_STATUS_META[status]
  return <Lozenge tone={meta.tone}>{meta.label}</Lozenge>
}
