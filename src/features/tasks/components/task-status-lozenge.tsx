import type { TaskStatus } from '@/features/tasks/api/types'
import { TASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { Lozenge } from '@/shared/components/ui/lozenge'

export function TaskStatusLozenge({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status]
  return <Lozenge tone={meta.tone}>{meta.label}</Lozenge>
}
