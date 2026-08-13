import { describe, expect, it } from 'vitest'

import type { Subtask } from '@/features/issues/api/types'
import {
  getNextSubtaskStatus,
  getPostDevelopmentStatus,
  getSubtaskFlow,
  getSubtaskStep,
} from '@/features/issues/constants/transitions'

const makeSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  issueNo: 'WR-2026-0001-01',
  parentIssueNo: 'WR-2026-0001',
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

describe('getSubtaskFlow', () => {
  it('비배포형은 4단계를 거친다', () => {
    const flow = getSubtaskFlow(makeSubtask({ type: 'NON_DEPLOY' }))

    expect(flow).toEqual(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'])
  })

  it('배포형은 DBA 검증을 받지 않으면 8단계를 거친다', () => {
    const flow = getSubtaskFlow(makeSubtask({ dbaVerificationRequest: null }))

    expect(flow).toHaveLength(8)
    expect(flow).not.toContain('DBA_VERIFICATION')
  })

  it('배포형은 DBA 검증 내용이 있으면 개발중과 제3자검증중 사이에 한 단계가 끼어든다', () => {
    const flow = getSubtaskFlow(makeSubtask({ dbaVerificationRequest: '인덱스 검토 요청' }))

    expect(flow).toHaveLength(9)
    expect(flow.slice(2, 5)).toEqual(['DEVELOPMENT', 'DBA_VERIFICATION', 'THIRD_PARTY'])
  })
})

describe('getSubtaskStep', () => {
  it('현재 상태의 단계 번호와 전체 단계 수를 돌려준다', () => {
    expect(getSubtaskStep(makeSubtask({ status: 'DEVELOPMENT' }))).toEqual({ step: 3, total: 8 })
  })

  it('같은 상태라도 DBA 검증이 붙으면 전체 단계 수가 늘어난다', () => {
    const withDba = makeSubtask({ status: 'DEVELOPMENT', dbaVerificationRequest: '검토 요청' })

    expect(getSubtaskStep(withDba)).toEqual({ step: 3, total: 9 })
  })
})

describe('getNextSubtaskStatus', () => {
  it('플로우를 한 단계씩만 전진한다', () => {
    expect(getNextSubtaskStatus(makeSubtask({ status: 'TODO' }))).toBe('ANALYSIS')
    expect(getNextSubtaskStatus(makeSubtask({ status: 'FUNCTIONAL_TEST' }))).toBe('DEPLOY_WAITING')
  })

  it('DBA 검증이 붙은 하위작업은 개발중 다음이 DBA검증중이다', () => {
    const withDba = makeSubtask({ status: 'DEVELOPMENT', dbaVerificationRequest: '검토 요청' })

    expect(getNextSubtaskStatus(withDba)).toBe('DBA_VERIFICATION')
  })

  it('완료 상태는 더 갈 곳이 없다', () => {
    expect(getNextSubtaskStatus(makeSubtask({ status: 'DONE' }))).toBeNull()
  })
})

describe('getPostDevelopmentStatus', () => {
  it('DBA 검증을 체크하지 않으면 제3자검증중으로 간다', () => {
    expect(getPostDevelopmentStatus(null)).toBe('THIRD_PARTY')
  })

  it('DBA 검증 내용을 입력하면 DBA검증중으로 간다', () => {
    expect(getPostDevelopmentStatus('인덱스 검토 요청')).toBe('DBA_VERIFICATION')
  })
})
