import { describe, expect, it } from 'vitest'

import type { Request, Subtask, TransitionEvidence } from '@/features/issues/api/types'
import {
  canConfirmAcceptance,
  canSubmitRequest,
  getDeploymentUrl,
  getRequestAdvanceState,
  getRequestApproveState,
  getRequiredApprovals,
  getStepEvidence,
  getSubtaskApprovalState,
  getSubtaskDeletionState,
  getSubtaskDeployGate,
  selectVisibleRequests,
} from '@/features/issues/utils/issue-selectors'
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
  issueNo: 'WR-2026-0001-01',
  parentIssueNo: 'WR-2026-0001',
  type: 'DEPLOY',
  title: '하위작업',
  description: '',
  status: 'TODO',
  assignee: { name: '임도윤', dept: '서비스개발실' },
  dueDate: null,
  completedAt: null,
  dbaVerificationRequest: null,
  approvals: [],
  evidences: [],
  history: [],
  branch: null,
  ...overrides,
})

const makeRequest = (overrides: Partial<Request> = {}): Request => ({
  issueNo: 'WR-2026-0001',
  title: '이슈',
  description: '',
  status: 'IN_PROGRESS',
  priority: 'NORMAL',
  requester: { name: '김현주', dept: '보험운영팀', contact: '02-1234-5678' },
  dueDate: '2026-12-31',
  createdAt: '2026-08-01',
  submittedAt: '2026-08-01',
  handlesPersonalData: false,
  consumerProtectionTarget: false,
  darkPatternChecked: true,
  attachments: [],
  subtasks: [],
  approvals: [],
  evidences: [],
  history: [],
  ...overrides,
})

const makeEvidence = (
  overrides: Partial<TransitionEvidence> = {}
): TransitionEvidence<Subtask['status']> => ({
  status: 'ANALYSIS',
  links: [],
  attachments: [],
  memo: '',
  recordedBy: '임도윤',
  recordedAt: '2026-08-01',
  ...overrides,
})

describe('selectVisibleRequests', () => {
  const draft = makeRequest({ issueNo: 'WR-2026-0001', status: 'DRAFT' })
  const mine = makeRequest({
    issueNo: 'WR-2026-0002',
    requester: { name: '김현주', dept: '보험운영팀', contact: '' },
  })
  const others = makeRequest({
    issueNo: 'WR-2026-0003',
    requester: { name: '최유진', dept: '여신관리팀', contact: '' },
  })

  it('임시저장 건은 누구에게도 목록에 보이지 않는다', () => {
    const visible = selectVisibleRequests([draft, mine], makeUser({ role: 'LEAD' }))

    expect(visible.map((request) => request.issueNo)).toEqual(['WR-2026-0002'])
  })

  it('요청자는 본인이 등록한 건만 본다', () => {
    const requester = makeUser({ name: '김현주', role: 'REQUESTER' })
    const visible = selectVisibleRequests([mine, others], requester)

    expect(visible.map((request) => request.issueNo)).toEqual(['WR-2026-0002'])
  })

  it('작업자 이상은 제출된 건을 모두 본다', () => {
    const visible = selectVisibleRequests([mine, others], makeUser({ role: 'WORKER' }))

    expect(visible).toHaveLength(2)
  })
})

describe('getRequiredApprovals', () => {
  it('개인정보·소비자보호 속성에 따라 필요한 결재가 붙는다', () => {
    expect(getRequiredApprovals(makeRequest())).toEqual([])
    expect(getRequiredApprovals(makeRequest({ handlesPersonalData: true }))).toEqual(['COMPLIANCE'])
    expect(
      getRequiredApprovals(
        makeRequest({ handlesPersonalData: true, consumerProtectionTarget: true })
      )
    ).toEqual(['COMPLIANCE', 'CONSUMER_PROTECTION'])
  })
})

describe('getRequestApproveState', () => {
  const lead = makeUser({ name: '윤서진', role: 'LEAD' })

  it('본인이 등록한 이슈는 직접 승인할 수 없다', () => {
    const own = makeRequest({ requester: { name: '윤서진', dept: '서비스개발실', contact: '' } })

    expect(getRequestApproveState(own, lead).enabled).toBe(false)
  })

  it('필요한 결재가 남아 있으면 승인할 수 없다', () => {
    const pending = makeRequest({ handlesPersonalData: true })
    const state = getRequestApproveState(pending, lead)

    expect(state.enabled).toBe(false)
    expect(state.reason).toContain('1건')
  })

  it('결재가 모두 떨어지면 승인할 수 있다', () => {
    const approved = makeRequest({
      handlesPersonalData: true,
      approvals: [{ kind: 'COMPLIANCE', approvedBy: '유지현', approvedAt: '2026-08-01 10:00' }],
    })

    expect(getRequestApproveState(approved, lead)).toEqual({ enabled: true, reason: null })
  })

  it('결재가 필요 없는 이슈는 바로 승인할 수 있다', () => {
    expect(getRequestApproveState(makeRequest(), lead).enabled).toBe(true)
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

describe('canSubmitRequest / canConfirmAcceptance', () => {
  const requester = makeUser({ name: '김현주', role: 'REQUESTER' })

  it('임시저장·반려 상태의 등록자만 제출할 수 있다', () => {
    expect(canSubmitRequest(makeRequest({ status: 'DRAFT' }), requester)).toBe(true)
    expect(canSubmitRequest(makeRequest({ status: 'REJECTED' }), requester)).toBe(true)
    expect(canSubmitRequest(makeRequest({ status: 'IN_PROGRESS' }), requester)).toBe(false)
  })

  it('등록자가 아니면 제출할 수 없다', () => {
    const other = makeUser({ name: '최유진', role: 'LEAD' })

    expect(canSubmitRequest(makeRequest({ status: 'DRAFT' }), other)).toBe(false)
  })

  it('인수 확인은 등록자 본인만 하고, 리드도 대행할 수 없다', () => {
    expect(canConfirmAcceptance(makeRequest(), requester)).toBe(true)
    expect(canConfirmAcceptance(makeRequest(), makeUser({ name: '윤서진', role: 'LEAD' }))).toBe(
      false
    )
    expect(canConfirmAcceptance(makeRequest(), makeUser({ name: '임도윤', role: 'WORKER' }))).toBe(
      false
    )
  })
})

describe('getRequestAdvanceState', () => {
  it('하위작업이 없으면 인수테스트를 요청할 수 없다', () => {
    const state = getRequestAdvanceState(makeRequest({ status: 'IN_PROGRESS', subtasks: [] }))

    expect(state.enabled).toBe(false)
    expect(state.reason).toContain('1건도 없어')
  })

  it('준비되지 않은 하위작업이 있으면 인수테스트를 요청할 수 없다', () => {
    const request = makeRequest({
      status: 'IN_PROGRESS',
      subtasks: [
        makeSubtask({ status: 'DEPLOY_WAITING' }),
        makeSubtask({ issueNo: 'WR-2026-0001-02', status: 'DEVELOPMENT' }),
      ],
    })

    expect(getRequestAdvanceState(request)).toMatchObject({ enabled: false })
  })

  it('배포형은 이행대기중, 비배포형은 완료면 준비된 것으로 본다', () => {
    const request = makeRequest({
      status: 'IN_PROGRESS',
      subtasks: [
        makeSubtask({ type: 'DEPLOY', status: 'DEPLOY_WAITING' }),
        makeSubtask({ issueNo: 'WR-2026-0001-02', type: 'NON_DEPLOY', status: 'DONE' }),
      ],
    })

    expect(getRequestAdvanceState(request)).toEqual({ enabled: true, reason: null })
  })

  it('이행대기중에서는 하위작업이 모두 완료돼야 최종 완료할 수 있다', () => {
    const running = makeRequest({
      status: 'DEPLOY_WAITING',
      subtasks: [makeSubtask({ status: 'POST_DEPLOY_CHECK' })],
    })
    const finished = makeRequest({
      status: 'DEPLOY_WAITING',
      subtasks: [makeSubtask({ status: 'DONE' })],
    })

    expect(getRequestAdvanceState(running).enabled).toBe(false)
    expect(getRequestAdvanceState(finished).enabled).toBe(true)
  })
})

describe('getSubtaskDeployGate', () => {
  const readyToDeploy = makeSubtask({ type: 'DEPLOY', status: 'DEPLOY_WAITING' })

  it('부모의 인수 확인이 끝나기 전에는 이행할 수 없다', () => {
    const gate = getSubtaskDeployGate(makeRequest({ status: 'ACCEPTANCE' }), readyToDeploy)

    expect(gate.blocked).toBe(true)
  })

  it('부모가 이행대기중이면 이행할 수 있다', () => {
    const gate = getSubtaskDeployGate(makeRequest({ status: 'DEPLOY_WAITING' }), readyToDeploy)

    expect(gate.blocked).toBe(false)
  })

  it('이행대기중이 아닌 하위작업은 게이트를 타지 않는다', () => {
    const gate = getSubtaskDeployGate(
      makeRequest({ status: 'IN_PROGRESS' }),
      makeSubtask({ status: 'DEVELOPMENT' })
    )

    expect(gate.blocked).toBe(false)
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
            { url: 'https://jenkins.example.com/1', label: '배포' },
            { url: 'https://jenkins.example.com/2', label: '재배포' },
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

describe('getSubtaskDeletionState', () => {
  it('작업대기중이고 이력이 없어야 삭제할 수 있다', () => {
    expect(getSubtaskDeletionState(makeSubtask()).enabled).toBe(true)
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
