import { describe, expect, it } from 'vitest'

import type { Subtask, Task, TransitionEvidence } from '@/features/tasks/api/types'
import {
  canActOnSubtaskStep,
  canEditTask,
  canSubmitTask,
  getDeploymentUrl,
  getRequiredApprovals,
  getStepEvidence,
  getSubtaskApprovalState,
  getSubtaskDeletionState,
  getSubtaskEditState,
  getTaskAdvanceState,
  getTaskApproveState,
  getTaskEditState,
  selectVisibleTasks,
} from '@/features/tasks/utils/task-selectors'
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
  ...overrides,
})

const makeEvidence = (overrides: Partial<TransitionEvidence> = {}): TransitionEvidence => ({
  status: 'ANALYSIS',
  links: [],
  attachments: [],
  memo: '',
  recordedBy: '임도윤',
  recordedAt: '2026-08-01',
  ...overrides,
})

describe('selectVisibleTasks', () => {
  const draft = makeTask({ taskNo: 'WR-2026-0001', status: 'DRAFT' })
  const mine = makeTask({
    taskNo: 'WR-2026-0002',
    requester: { id: 'user-kim', name: '김현주', dept: '보험운영팀', contact: '' },
  })
  const others = makeTask({
    taskNo: 'WR-2026-0003',
    requester: { id: 'user-choi', name: '최유진', dept: '여신관리팀', contact: '' },
  })

  it('임시저장 건은 등록자가 아니면 목록에 보이지 않는다', () => {
    const visible = selectVisibleTasks([draft, mine], makeUser({ role: 'LEAD' }))

    expect(visible.map((task) => task.taskNo)).toEqual(['WR-2026-0002'])
  })

  it('임시저장 건은 등록자 본인에게는 보인다', () => {
    const requester = makeUser({ id: 'user-kim', name: '김현주', role: 'REQUESTER' })
    const visible = selectVisibleTasks([draft, mine], requester)

    expect(visible.map((task) => task.taskNo)).toEqual(['WR-2026-0001', 'WR-2026-0002'])
  })

  it('담당자는 본인이 등록한 건만 본다', () => {
    const requester = makeUser({ id: 'user-kim', name: '김현주', role: 'REQUESTER' })
    const visible = selectVisibleTasks([mine, others], requester)

    expect(visible.map((task) => task.taskNo)).toEqual(['WR-2026-0002'])
  })

  it('작업자 이상은 제출된 건을 모두 본다', () => {
    const visible = selectVisibleTasks([mine, others], makeUser({ role: 'WORKER' }))

    expect(visible).toHaveLength(2)
  })
})

describe('getRequiredApprovals', () => {
  it('개인정보·소비자보호 속성에 따라 필요한 결재가 붙는다', () => {
    expect(getRequiredApprovals(makeTask())).toEqual([])
    expect(getRequiredApprovals(makeTask({ handlesPersonalData: true }))).toEqual(['COMPLIANCE'])
    expect(
      getRequiredApprovals(makeTask({ handlesPersonalData: true, consumerProtectionTarget: true }))
    ).toEqual(['COMPLIANCE', 'CONSUMER_PROTECTION'])
  })
})

describe('getTaskApproveState', () => {
  const lead = makeUser({ id: 'user-yoon', name: '윤서진', role: 'LEAD' })

  it('본인이 등록한 작업은 직접 승인할 수 없다', () => {
    const own = makeTask({
      requester: { id: 'user-yoon', name: '윤서진', dept: '서비스개발실', contact: '' },
    })

    expect(getTaskApproveState(own, lead).enabled).toBe(false)
  })

  it('필요한 결재가 남아 있으면 승인할 수 없다', () => {
    const pending = makeTask({ handlesPersonalData: true })
    const state = getTaskApproveState(pending, lead)

    expect(state.enabled).toBe(false)
    expect(state.reason).toContain('1건')
  })

  it('결재가 모두 떨어지면 승인할 수 있다', () => {
    const approved = makeTask({
      handlesPersonalData: true,
      approvals: [{ kind: 'COMPLIANCE', approvedBy: '유지현', approvedAt: '2026-08-01 10:00' }],
    })

    expect(getTaskApproveState(approved, lead)).toEqual({ enabled: true, reason: null })
  })

  it('결재가 필요 없는 작업은 바로 승인할 수 있다', () => {
    expect(getTaskApproveState(makeTask(), lead).enabled).toBe(true)
  })
})

describe('getSubtaskApprovalState', () => {
  it('DBA 검증을 받지 않는 하위작업은 결재가 필요 없다', () => {
    expect(getSubtaskApprovalState(makeSubtask()).complete).toBe(true)
  })

  it('DBA 검증 내용이 있으면 DBA 결재가 떨어져야 완료된다', () => {
    const pending = makeSubtask({ dbaVerificationRequest: '인덱스 검토' })

    expect(getSubtaskApprovalState(pending)).toMatchObject({ pending: ['DBA'], complete: false })
  })
})

describe('canSubmitTask', () => {
  const requester = makeUser({ id: 'user-kim', name: '김현주', role: 'REQUESTER' })

  it('임시저장·반려 상태의 등록자만 제출할 수 있다', () => {
    expect(canSubmitTask(makeTask({ status: 'DRAFT' }), requester)).toBe(true)
    expect(canSubmitTask(makeTask({ status: 'REJECTED' }), requester)).toBe(true)
    expect(canSubmitTask(makeTask({ status: 'IN_PROGRESS' }), requester)).toBe(false)
  })

  it('등록자가 아니면 제출할 수 없다', () => {
    const other = makeUser({ name: '최유진', role: 'LEAD' })

    expect(canSubmitTask(makeTask({ status: 'DRAFT' }), other)).toBe(false)
  })
})

describe('canActOnSubtaskStep', () => {
  const requester = makeUser({ id: 'user-kim', name: '김현주', role: 'REQUESTER' })
  const assignee = makeUser()
  const lead = makeUser({ id: 'user-yoon', name: '윤서진', role: 'LEAD' })

  it('일반 단계는 작업자 본인과 리드만 수행한다', () => {
    const subtask = makeSubtask({ status: 'DEVELOPMENT' })

    expect(canActOnSubtaskStep(makeTask(), subtask, assignee, 'DEVELOPMENT')).toBe(true)
    expect(canActOnSubtaskStep(makeTask(), subtask, lead, 'DEVELOPMENT')).toBe(true)
    expect(canActOnSubtaskStep(makeTask(), subtask, requester, 'DEVELOPMENT')).toBe(false)
    expect(
      canActOnSubtaskStep(
        makeTask(),
        subtask,
        makeUser({ id: 'user-park', name: '박민수' }),
        'DEVELOPMENT'
      )
    ).toBe(false)
  })

  it('인수 테스트중은 등록자 본인만 수행하고, 리드·작업자도 대행할 수 없다', () => {
    const subtask = makeSubtask({ status: 'ACCEPTANCE' })

    expect(canActOnSubtaskStep(makeTask(), subtask, requester, 'ACCEPTANCE')).toBe(true)
    expect(canActOnSubtaskStep(makeTask(), subtask, lead, 'ACCEPTANCE')).toBe(false)
    expect(canActOnSubtaskStep(makeTask(), subtask, assignee, 'ACCEPTANCE')).toBe(false)
  })
})

describe('canEditTask / getTaskEditState', () => {
  const requester = makeUser({ id: 'user-kim', name: '김현주', role: 'REQUESTER' })

  it('수정 주체는 등록자 본인뿐이고, 리드여도 남의 작업은 손댈 수 없다', () => {
    expect(canEditTask(makeTask(), requester)).toBe(true)
    expect(canEditTask(makeTask(), makeUser({ name: '최유진', role: 'LEAD' }))).toBe(false)
  })

  it('요청대기중·반려에서만 고칠 수 있다', () => {
    expect(getTaskEditState(makeTask({ status: 'DRAFT' })).enabled).toBe(true)
    expect(getTaskEditState(makeTask({ status: 'REJECTED' })).enabled).toBe(true)
  })

  it('검토 중에는 회수하라고 알려준다', () => {
    const state = getTaskEditState(makeTask({ status: 'PENDING_APPROVAL' }))

    expect(state.enabled).toBe(false)
    expect(state.reason).toContain('회수')
  })

  it('승인 이후에는 잠긴다', () => {
    expect(getTaskEditState(makeTask({ status: 'IN_PROGRESS' })).enabled).toBe(false)
    expect(getTaskEditState(makeTask({ status: 'DONE' })).enabled).toBe(false)
  })
})

describe('getTaskAdvanceState', () => {
  it('하위작업이 없으면 완료할 수 없다', () => {
    const state = getTaskAdvanceState(makeTask({ status: 'IN_PROGRESS', subtasks: [] }))

    expect(state.enabled).toBe(false)
    expect(state.reason).toContain('1건도 없어')
  })

  it('진행 중인 하위작업이 있으면 완료할 수 없다', () => {
    const task = makeTask({
      status: 'IN_PROGRESS',
      subtasks: [
        makeSubtask({ status: 'DONE' }),
        makeSubtask({ subtaskNo: 'WR-2026-0001-02', status: 'POST_DEPLOY_CHECK' }),
      ],
    })
    const state = getTaskAdvanceState(task)

    expect(state.enabled).toBe(false)
    expect(state.reason).toContain('1건')
  })

  it('하위작업이 모두 완료되면 최종 완료할 수 있다', () => {
    const task = makeTask({
      status: 'IN_PROGRESS',
      subtasks: [
        makeSubtask({ status: 'DONE' }),
        makeSubtask({ subtaskNo: 'WR-2026-0001-02', type: 'NON_DEPLOY', status: 'DONE' }),
      ],
    })

    expect(getTaskAdvanceState(task)).toEqual({ enabled: true, reason: null })
  })

  it('작업중이 아니면 진행 버튼이 없다', () => {
    expect(getTaskAdvanceState(makeTask({ status: 'PENDING_APPROVAL' })).enabled).toBe(false)
    expect(getTaskAdvanceState(makeTask({ status: 'DONE' })).enabled).toBe(false)
  })
})

describe('getStepEvidence', () => {
  it('같은 단계가 여러 건이면 마지막 건이 유효하고 앞선 건은 정정 이력이 된다', () => {
    const subtask = makeSubtask({
      evidences: [
        makeEvidence({ status: 'ANALYSIS', memo: '최초' }),
        makeEvidence({ status: 'ANALYSIS', memo: '정정본' }),
        makeEvidence({ status: 'DEVELOPMENT', memo: '개발' }),
      ],
    })

    expect(getStepEvidence(subtask, 'ANALYSIS')).toMatchObject({
      latest: { memo: '정정본' },
      revisions: 1,
    })
    expect(getStepEvidence(subtask, 'DEVELOPMENT').revisions).toBe(0)
  })

  it('기록이 없는 단계는 null을 돌려준다', () => {
    expect(getStepEvidence(makeSubtask(), 'ANALYSIS')).toEqual({ latest: null, revisions: 0 })
  })
})

describe('getDeploymentUrl', () => {
  it('이행 단계 증적의 첫 링크를 배포 완료 URL로 쓴다', () => {
    const subtask = makeSubtask({
      evidences: [
        makeEvidence({
          status: 'DEPLOY_WAITING',
          links: [
            { url: 'https://jenkins.example.com/1' },
            { url: 'https://jenkins.example.com/2' },
          ],
        }),
      ],
    })

    expect(getDeploymentUrl(subtask)).toBe('https://jenkins.example.com/1')
  })

  it('이행 증적이 없으면 null이다', () => {
    expect(getDeploymentUrl(makeSubtask())).toBeNull()
  })
})

describe('getSubtaskEditState', () => {
  it('진행 중인 하위작업은 수정할 수 있다', () => {
    expect(getSubtaskEditState(makeSubtask({ status: 'DEVELOPMENT' })).enabled).toBe(true)
  })

  it('완료된 하위작업은 수정할 수 없다', () => {
    expect(getSubtaskEditState(makeSubtask({ status: 'DONE' })).enabled).toBe(false)
  })
})

describe('getSubtaskDeletionState', () => {
  it('작업대기중이고 전이 이력이 없어야 삭제할 수 있다', () => {
    expect(getSubtaskDeletionState(makeSubtask()).enabled).toBe(true)
  })

  it('내용 수정 이력(from == to)은 삭제를 막지 않는다', () => {
    const edited = makeSubtask({
      history: [
        {
          id: 1,
          occurredAt: '2026-08-01 10:00',
          actorName: '임도윤',
          fromStatus: 'TODO',
          toStatus: 'TODO',
          via: 'MANUAL',
          reason: '제목 수정',
        },
      ],
    })

    expect(getSubtaskDeletionState(edited).enabled).toBe(true)
  })

  it('전이한 하위작업은 삭제할 수 없다', () => {
    expect(getSubtaskDeletionState(makeSubtask({ status: 'ANALYSIS' })).enabled).toBe(false)
  })

  it('작업대기중이라도 전이 이력이 있으면 삭제할 수 없다', () => {
    const reverted = makeSubtask({
      history: [
        {
          id: 1,
          occurredAt: '2026-08-01 10:00',
          actorName: '임도윤',
          fromStatus: 'TODO',
          toStatus: 'ANALYSIS',
          via: 'MANUAL',
          reason: null,
        },
      ],
    })

    expect(getSubtaskDeletionState(reverted).enabled).toBe(false)
  })
})
