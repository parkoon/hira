import { describe, expect, it } from 'vitest'

import type { Subtask, Task } from '@/features/tasks/api/types'
import { selectMyTurnItems } from '@/features/tasks/utils/my-turn'
import type { User } from '@/features/users/api/types'

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  loginId: '900003',
  name: '임도윤',
  dept: '서비스개발실',
  role: 'WORKER',
  contact: '02-1234-5671',
  external: false,
  roleChangedAt: null,
  roleChangedBy: null,
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
  consultant: { id: 'user-1', name: '임도윤', dept: '서비스개발실' },
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

const keysOf = (tasks: Task[], user: User) => selectMyTurnItems(tasks, user).map((item) => item.key)

describe('selectMyTurnItems', () => {
  it('등록자에게는 임시저장 건의 승인 요청과 반려 건의 재요청이 쌓인다', () => {
    const requester = makeUser({ id: 'user-kim', role: 'REQUESTER' })
    const tasks = [
      makeTask({ taskNo: 'WR-2026-0001', status: 'DRAFT' }),
      makeTask({ taskNo: 'WR-2026-0002', status: 'REJECTED' }),
      makeTask({ taskNo: 'WR-2026-0003', status: 'PENDING_APPROVAL' }),
    ]

    const items = selectMyTurnItems(tasks, requester)

    expect(items.map((item) => [item.key, item.action])).toEqual([
      ['WR-2026-0001', '승인 요청'],
      ['WR-2026-0002', '수정 후 재요청'],
    ])
  })

  it('리드에게는 남의 제출 건만 승인 검토로 쌓인다 — 본인 등록 건은 승인할 수 없다', () => {
    const lead = makeUser({ id: 'user-lead', role: 'LEAD' })
    const tasks = [
      makeTask({ taskNo: 'WR-2026-0001', status: 'PENDING_APPROVAL' }),
      makeTask({
        taskNo: 'WR-2026-0002',
        status: 'PENDING_APPROVAL',
        requester: { id: 'user-lead', name: '박리드', dept: '서비스개발실', contact: '' },
      }),
    ]

    expect(keysOf(tasks, lead)).toEqual(['WR-2026-0001'])
  })

  it('작업자에게 제출 건은 내 차례가 아니다', () => {
    const worker = makeUser({ role: 'WORKER' })
    const tasks = [makeTask({ status: 'PENDING_APPROVAL' })]

    expect(keysOf(tasks, worker)).toEqual([])
  })

  it('리드에게는 하위작업이 전건 완료된 작업만 최종 완료로 쌓인다', () => {
    const lead = makeUser({ id: 'user-lead', role: 'LEAD' })
    const done = makeTask({
      taskNo: 'WR-2026-0001',
      subtasks: [makeSubtask({ status: 'DONE' })],
    })
    const inProgress = makeTask({
      taskNo: 'WR-2026-0002',
      subtasks: [makeSubtask({ subtaskNo: 'WR-2026-0002-01', status: 'DEVELOPMENT' })],
    })

    const items = selectMyTurnItems([done, inProgress], lead)

    expect(items.filter((item) => item.action === '최종 완료').map((item) => item.key)).toEqual([
      'WR-2026-0001',
    ])
  })

  it('작업자에게는 배정된 하위작업의 현재 단계가 전이 라벨과 함께 쌓인다', () => {
    const worker = makeUser({ id: 'user-1' })
    const tasks = [
      makeTask({
        subtasks: [
          makeSubtask({ subtaskNo: 'WR-2026-0001-01', status: 'ANALYSIS' }),
          // 결재가 밀어주는 단계라 사람 차례가 아니다
          makeSubtask({ subtaskNo: 'WR-2026-0001-02', status: 'DBA_VERIFICATION' }),
          makeSubtask({ subtaskNo: 'WR-2026-0001-03', status: 'DONE' }),
          // 남의 하위작업
          makeSubtask({
            subtaskNo: 'WR-2026-0001-04',
            status: 'DEVELOPMENT',
            assignee: { id: 'user-2', name: '최유진', dept: '서비스개발실' },
          }),
        ],
      }),
    ]

    const items = selectMyTurnItems(tasks, worker)

    expect(items.map((item) => [item.key, item.action])).toEqual([['WR-2026-0001-01', '분석 완료']])
  })

  it('인수 테스트중은 작업자가 아니라 등록자의 차례다', () => {
    const acceptance = makeTask({
      subtasks: [makeSubtask({ status: 'ACCEPTANCE' })],
    })
    const assignee = makeUser({ id: 'user-1' })
    const requester = makeUser({ id: 'user-kim', role: 'REQUESTER' })

    expect(keysOf([acceptance], assignee)).toEqual([])
    expect(selectMyTurnItems([acceptance], requester).map((item) => item.action)).toEqual([
      '인수 확인',
    ])
  })

  it('목표일이 급한 것이 앞에 오고, 없는 것은 뒤로 간다', () => {
    const worker = makeUser({ id: 'user-1' })
    const tasks = [
      makeTask({
        subtasks: [
          makeSubtask({ subtaskNo: 'WR-2026-0001-01', status: 'ANALYSIS', dueDate: null }),
          makeSubtask({ subtaskNo: 'WR-2026-0001-02', status: 'ANALYSIS', dueDate: '2026-09-01' }),
          makeSubtask({ subtaskNo: 'WR-2026-0001-03', status: 'ANALYSIS', dueDate: '2026-08-20' }),
        ],
      }),
    ]

    expect(keysOf(tasks, worker)).toEqual(['WR-2026-0001-03', 'WR-2026-0001-02', 'WR-2026-0001-01'])
  })
})
