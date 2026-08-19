import { differenceInCalendarDays, parseISO } from 'date-fns'

import type { SubtaskStatus, Task } from '@/features/tasks/api/types'
import { SUBTASK_STATUS_META } from '@/features/tasks/constants/metadata'
import { isKnownEnumValue } from '@/shared/utils/enum'

/** 이력 시각 'yyyy-MM-dd HH:mm' — ISO 구분자로 바꿔야 전 브라우저에서 같게 읽힌다 */
const toDate = (occurredAt: string) => parseISO(occurredAt.replace(' ', 'T'))

const round1 = (value: number) => Math.round(value * 10) / 10

export type TaskSummary = {
  inProgress: number
  done: number
  /** 진행 중인데 목표일이 지난 작업 수 */
  overdue: number
  /** 승인 요청(제출)부터 최종 완료까지 평균 일수. 잴 수 있는 완료 건이 없으면 null */
  avgLeadDays: number | null
  /** 평균에 들어간 완료 건수 — 제출 기록이 없는 옛 데이터는 평균에서 빠진다 */
  leadSamples: number
}

export function getTaskSummary(tasks: Task[], today: string): TaskSummary {
  const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length
  const done = tasks.filter((task) => task.status === 'DONE').length
  const overdue = tasks.filter((task) => task.status !== 'DONE' && task.dueDate < today).length

  const leads: number[] = []
  for (const task of tasks) {
    if (task.status !== 'DONE' || task.submittedAt === null) continue
    // 이력은 최신순이라 첫 매칭이 곧 마지막 완료 전이다 (재제출로 여러 번 돌았어도 최종 기준)
    const doneEntry = task.history.find(
      (entry) => entry.toStatus === 'DONE' && entry.fromStatus !== entry.toStatus
    )
    if (!doneEntry) continue
    leads.push(differenceInCalendarDays(toDate(doneEntry.occurredAt), parseISO(task.submittedAt)))
  }

  return {
    inProgress,
    done,
    overdue,
    leadSamples: leads.length,
    avgLeadDays:
      leads.length === 0 ? null : round1(leads.reduce((sum, days) => sum + days, 0) / leads.length),
  }
}

export type StageDuration = {
  status: SubtaskStatus
  label: string
  /** 이 단계에 머문 평균 일수 (전이 시각 차이, 소수 첫째 자리) */
  avgDays: number
  /** 평균에 들어간 구간 수 */
  samples: number
}

/**
 * 하위작업이 각 단계에 머문 평균 시간 — status_history의 전이 시각 차이로 잰다.
 *
 * - 수정 기록(from == to)은 단계 경계가 아니라 건너뛴다.
 * - 아직 다음 전이가 없는 마지막 구간(지금 진행 중인 단계)은 재지 않는다 — 미완 구간을
 *   섞으면 평균이 실제보다 짧아 보인다. 완료는 나가는 전이가 없어 자연히 빠진다.
 * - 작업대기중은 생성 시각이 날짜 단위뿐이라 재지 않는다 — 첫 전이부터가 측정 구간이다.
 */
export function getStageDurations(tasks: Task[]): StageDuration[] {
  const buckets = new Map<SubtaskStatus, number[]>()

  for (const task of tasks) {
    for (const subtask of task.subtasks) {
      // DTO는 최신순 — 오래된 것부터 짝지어야 하므로 뒤집는다
      const transitions = [...subtask.history]
        .reverse()
        .filter((entry) => entry.fromStatus !== entry.toStatus)

      for (let index = 0; index < transitions.length - 1; index++) {
        const status = transitions[index].toStatus
        if (!isKnownEnumValue(SUBTASK_STATUS_META, status)) continue

        const days =
          (toDate(transitions[index + 1].occurredAt).getTime() -
            toDate(transitions[index].occurredAt).getTime()) /
          86_400_000
        buckets.set(status, [...(buckets.get(status) ?? []), Math.max(days, 0)])
      }
    }
  }

  return [...buckets.entries()]
    .map(([status, durations]) => ({
      status,
      label: SUBTASK_STATUS_META[status].label,
      avgDays: round1(durations.reduce((sum, days) => sum + days, 0) / durations.length),
      samples: durations.length,
    }))
    .sort((a, b) => SUBTASK_STATUS_META[a.status].order - SUBTASK_STATUS_META[b.status].order)
}
