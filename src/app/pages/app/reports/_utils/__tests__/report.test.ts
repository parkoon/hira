import { describe, expect, it } from 'vitest'

import type { StatusHistoryEntry, Subtask, Task } from '@/features/tasks/api/types'

import { getStageDurations, getTaskSummary } from '../report'

let historyId = 0
const makeEntry = (overrides: Partial<StatusHistoryEntry>): StatusHistoryEntry => ({
  id: ++historyId,
  occurredAt: '2026-08-01 09:00',
  actorName: '임도윤',
  fromStatus: null,
  toStatus: 'TODO',
  via: 'MANUAL',
  reason: null,
  ...overrides,
})

const makeSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  subtaskNo: 'WR-2026-0001-01',
  parentTaskNo: 'WR-2026-0001',
  type: 'DEPLOY',
  title: '하위작업',
  description: '',
  status: 'TODO',
  assignee: { id: 'user-1', name: '임도윤', dept: '서비스개발실' },
  dueDate: null,
  completedAt: null,
  dbaVerificationRequest: null,
  approvals: [],
  evidences: [],
  history: [],
  comments: [],
  branch: null,
  ...overrides,
})

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  taskNo: 'WR-2026-0001',
  title: '작업',
  description: '',
  status: 'IN_PROGRESS',
  priority: 'NORMAL',
  requester: { id: 'user-kim', name: '김현주', dept: '보험운영팀', contact: '02-1234-5678' },
  consultant: null,
  dueDate: '2026-12-31',
  createdAt: '2026-08-01',
  submittedAt: '2026-08-01',
  handlesPersonalData: false,
  consumerProtectionTarget: false,
  darkPatternChecked: true,
  attachments: [],
  subtasks: [],
  approvals: [],
  history: [],
  comments: [],
  ...overrides,
})

describe('getTaskSummary', () => {
  it('진행중·완료·지연을 상태와 목표일로 센다', () => {
    const tasks = [
      makeTask({ taskNo: 'WR-2026-0001', status: 'IN_PROGRESS', dueDate: '2026-08-10' }),
      makeTask({ taskNo: 'WR-2026-0002', status: 'DONE', dueDate: '2026-08-10' }),
      makeTask({ taskNo: 'WR-2026-0003', status: 'PENDING_APPROVAL', dueDate: '2026-09-01' }),
    ]

    const summary = getTaskSummary(tasks, '2026-08-19')

    expect(summary.inProgress).toBe(1)
    expect(summary.done).toBe(1)
    // 완료된 건의 지난 목표일은 지연이 아니다
    expect(summary.overdue).toBe(1)
  })

  it('평균 처리일은 제출부터 마지막 완료 전이까지로 잰다', () => {
    const done = makeTask({
      status: 'DONE',
      submittedAt: '2026-08-01',
      history: [
        // 최신순 — 마지막 완료 전이가 맨 앞이다
        makeEntry({ fromStatus: 'IN_PROGRESS', toStatus: 'DONE', occurredAt: '2026-08-11 18:00' }),
        makeEntry({
          fromStatus: 'PENDING_APPROVAL',
          toStatus: 'IN_PROGRESS',
          occurredAt: '2026-08-02 09:00',
        }),
      ],
    })

    const summary = getTaskSummary([done], '2026-08-19')

    expect(summary.avgLeadDays).toBe(10)
    expect(summary.leadSamples).toBe(1)
  })

  it('잴 수 있는 완료 건이 없으면 평균은 null이다', () => {
    const summary = getTaskSummary([makeTask({ status: 'IN_PROGRESS' })], '2026-08-19')

    expect(summary.avgLeadDays).toBeNull()
    expect(summary.leadSamples).toBe(0)
  })
})

describe('getStageDurations', () => {
  it('전이 시각 차이로 단계 체류를 재고, 진행 중인 마지막 구간은 빼놓는다', () => {
    const subtask = makeSubtask({
      status: 'DEVELOPMENT',
      history: [
        // DTO와 같은 최신순으로 담는다
        makeEntry({
          fromStatus: 'ANALYSIS',
          toStatus: 'DEVELOPMENT',
          occurredAt: '2026-08-04 09:00',
        }),
        makeEntry({ fromStatus: 'TODO', toStatus: 'ANALYSIS', occurredAt: '2026-08-01 09:00' }),
      ],
    })

    const durations = getStageDurations([makeTask({ subtasks: [subtask] })])

    // 분석 설계중 3일. 개발중은 아직 나가는 전이가 없어 재지 않는다
    expect(durations).toEqual([
      { status: 'ANALYSIS', label: '분석 설계중', avgDays: 3, samples: 1 },
    ])
  })

  it('수정 기록(from == to)은 단계 경계로 치지 않는다', () => {
    const subtask = makeSubtask({
      history: [
        makeEntry({
          fromStatus: 'ANALYSIS',
          toStatus: 'DEVELOPMENT',
          occurredAt: '2026-08-03 09:00',
        }),
        // 중간의 제목 수정 — 체류 계산을 끊으면 안 된다
        makeEntry({ fromStatus: 'ANALYSIS', toStatus: 'ANALYSIS', occurredAt: '2026-08-02 09:00' }),
        makeEntry({ fromStatus: 'TODO', toStatus: 'ANALYSIS', occurredAt: '2026-08-01 09:00' }),
      ],
    })

    const durations = getStageDurations([makeTask({ subtasks: [subtask] })])

    expect(durations).toEqual([
      { status: 'ANALYSIS', label: '분석 설계중', avgDays: 2, samples: 1 },
    ])
  })

  it('여러 하위작업의 같은 단계는 평균으로 묶고 워크플로 순서로 나열한다', () => {
    const first = makeSubtask({
      subtaskNo: 'WR-2026-0001-01',
      history: [
        makeEntry({
          fromStatus: 'ANALYSIS',
          toStatus: 'DEVELOPMENT',
          occurredAt: '2026-08-02 09:00',
        }),
        makeEntry({ fromStatus: 'TODO', toStatus: 'ANALYSIS', occurredAt: '2026-08-01 09:00' }),
      ],
    })
    const second = makeSubtask({
      subtaskNo: 'WR-2026-0001-02',
      history: [
        makeEntry({
          fromStatus: 'DEVELOPMENT',
          toStatus: 'THIRD_PARTY',
          occurredAt: '2026-08-08 09:00',
        }),
        makeEntry({
          fromStatus: 'ANALYSIS',
          toStatus: 'DEVELOPMENT',
          occurredAt: '2026-08-06 09:00',
        }),
        makeEntry({ fromStatus: 'TODO', toStatus: 'ANALYSIS', occurredAt: '2026-08-03 09:00' }),
      ],
    })

    const durations = getStageDurations([makeTask({ subtasks: [first, second] })])

    expect(durations).toEqual([
      // (1일 + 3일) / 2 = 2일
      { status: 'ANALYSIS', label: '분석 설계중', avgDays: 2, samples: 2 },
      { status: 'DEVELOPMENT', label: '개발중', avgDays: 2, samples: 1 },
    ])
  })
})
