import type { Subtask, SubtaskStatus, Task, TaskStatus } from '@/features/tasks/api/types'
import { SUBTASK_ADVANCE_LABEL } from '@/features/tasks/constants/metadata'
import { getTaskAdvanceState } from '@/features/tasks/utils/task-selectors'
import type { User } from '@/features/users/api/types'
import { ROLE_LEVEL } from '@/features/users/constants/metadata'
import { paths } from '@/shared/config/paths'

/** 내 할 일 화면의 한 행 — 작업과 하위작업이 한 목록에 섞인다 */
export type MyTurnItem = {
  /** 작업번호·하위작업번호 — 겹치지 않아 목록을 통틀어 유일하다 */
  key: string
  title: string
  /** 지금 해야 할 일 — 전이 버튼과 같은 어휘를 쓴다 */
  action: string
  dueDate: string | null
  href: string
} & ({ kind: 'task'; status: TaskStatus } | { kind: 'subtask'; status: SubtaskStatus })

/**
 * 지금 내가 움직여야 흐름이 진행되는 것들 (승인 대기함의 전 역할 일반화).
 *
 * 직접 책임만 담는다 — 리드는 모든 하위작업 단계를 대행할 수 있지만(`canActOnSubtaskStep`)
 * 그것은 능력이지 의무가 아니라, 대행 가능하다는 이유로 전 하위작업을 쌓으면 소음이 된다.
 * 하위작업은 작업자 본인의 단계와 등록자 본인의 인수 테스트중만 올린다.
 */
export function selectMyTurnItems(tasks: Task[], user: User): MyTurnItem[] {
  const isLead = ROLE_LEVEL[user.role] >= ROLE_LEVEL.LEAD
  const items: MyTurnItem[] = []

  const taskItem = (task: Task, action: string): MyTurnItem => ({
    kind: 'task',
    key: task.taskNo,
    title: task.title,
    action,
    status: task.status,
    dueDate: task.dueDate,
    href: paths.app.tasks.detail.getHref(task.taskNo),
  })

  const subtaskItem = (subtask: Subtask, action: string): MyTurnItem => ({
    kind: 'subtask',
    key: subtask.subtaskNo,
    title: subtask.title,
    action,
    status: subtask.status,
    dueDate: subtask.dueDate,
    href: paths.app.tasks.subtask.getHref(subtask.parentTaskNo, subtask.subtaskNo),
  })

  for (const task of tasks) {
    const mine = task.requester.id === user.id

    if (task.status === 'DRAFT' && mine) {
      items.push(taskItem(task, '승인 요청'))
    }
    if (task.status === 'REJECTED' && mine) {
      items.push(taskItem(task, '수정 후 재요청'))
    }
    // 본인이 등록한 건은 직접 승인할 수 없으니 리드여도 내 차례가 아니다
    if (task.status === 'PENDING_APPROVAL' && isLead && !mine) {
      items.push(taskItem(task, '승인 검토'))
    }
    if (task.status === 'IN_PROGRESS' && isLead && getTaskAdvanceState(task).enabled) {
      items.push(taskItem(task, '최종 완료'))
    }

    for (const subtask of task.subtasks) {
      // 라벨이 없는 단계는 사람이 밀 수 없다 — DBA검증중은 결재로, 완료는 더 갈 곳이 없다
      const action = SUBTASK_ADVANCE_LABEL[subtask.status]
      if (!action) continue

      const myStep = subtask.status === 'ACCEPTANCE' ? mine : subtask.assignee.id === user.id
      if (myStep) items.push(subtaskItem(subtask, action))
    }
  }

  // 급한 것 먼저 — 목표일 없는 하위작업은 뒤로, 같은 날짜는 번호순
  return items.sort((a, b) => {
    if (a.dueDate === b.dueDate) return a.key.localeCompare(b.key)
    if (a.dueDate === null) return 1
    if (b.dueDate === null) return -1
    return a.dueDate.localeCompare(b.dueDate)
  })
}
