import { describe, expect, it } from 'vitest'

import {
  TASK_TREE_DEFAULT_SIZE,
  TASK_TREE_DEFAULT_SORT,
  TASK_TREE_MAX_SIZE,
} from '../../_constants'
import { normalizeTaskTreeParams } from '../task-tree-params'

const makeRaw = (overrides: Partial<Parameters<typeof normalizeTaskTreeParams>[0]> = {}) => ({
  page: 1,
  size: TASK_TREE_DEFAULT_SIZE,
  q: '',
  status: [] as string[],
  assignee: '',
  sort: TASK_TREE_DEFAULT_SORT,
  ...overrides,
})

describe('normalizeTaskTreeParams', () => {
  it('페이지가 1보다 작으면 첫 페이지로 올린다', () => {
    expect(normalizeTaskTreeParams(makeRaw({ page: 0 })).page).toBe(1)
    expect(normalizeTaskTreeParams(makeRaw({ page: -7 })).page).toBe(1)
  })

  it('페이지 크기는 1과 상한 사이로 자른다', () => {
    expect(normalizeTaskTreeParams(makeRaw({ size: 500 })).size).toBe(TASK_TREE_MAX_SIZE)
    expect(normalizeTaskTreeParams(makeRaw({ size: 0 })).size).toBe(TASK_TREE_DEFAULT_SIZE)
    expect(normalizeTaskTreeParams(makeRaw({ size: 35 })).size).toBe(35)
  })

  it('작업 상태와 하위작업 상태를 함께 받고, 모르는 코드만 버린다', () => {
    const params = normalizeTaskTreeParams(
      makeRaw({ status: ['IN_PROGRESS', 'ANALYSIS', 'NOT_A_STATUS'] })
    )

    expect(params.status).toEqual(['IN_PROGRESS', 'ANALYSIS'])
  })

  it('화이트리스트 밖 정렬 값은 기본 정렬로 되돌린다', () => {
    expect(normalizeTaskTreeParams(makeRaw({ sort: 'password,asc' })).sort).toBe(
      TASK_TREE_DEFAULT_SORT
    )
    // 방향이 빠진 값도 API 계약을 못 맞추므로 기본값으로 떨어진다
    expect(normalizeTaskTreeParams(makeRaw({ sort: 'createdAt' })).sort).toBe(
      TASK_TREE_DEFAULT_SORT
    )
  })

  it('화이트리스트 안 정렬 값은 그대로 통과시킨다', () => {
    expect(normalizeTaskTreeParams(makeRaw({ sort: 'title,asc' })).sort).toBe('title,asc')
  })

  it('담당자가 비어 있으면 조건을 걸지 않는다', () => {
    expect(normalizeTaskTreeParams(makeRaw({ assignee: '' })).assigneeId).toBeNull()
    expect(normalizeTaskTreeParams(makeRaw({ assignee: 'user-1' })).assigneeId).toBe('user-1')
  })

  it('검색어는 손대지 않고 원문 그대로 넘긴다 — 이스케이프와 trim은 서버 몫이다', () => {
    expect(normalizeTaskTreeParams(makeRaw({ q: '  50% 할인_안내  ' })).q).toBe('  50% 할인_안내  ')
  })
})
