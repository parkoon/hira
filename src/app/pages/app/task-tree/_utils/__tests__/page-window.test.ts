import { describe, expect, it } from 'vitest'

import { getPageWindow } from '../page-window'

describe('getPageWindow', () => {
  it('총 페이지가 창보다 적으면 있는 만큼만 보여준다', () => {
    expect(getPageWindow(1, 3)).toEqual([1, 2, 3])
  })

  it('현재 페이지를 창 가운데 둔다', () => {
    expect(getPageWindow(7, 20)).toEqual([5, 6, 7, 8, 9])
  })

  it('양 끝에서는 창을 안쪽으로 밀어 개수를 유지한다', () => {
    expect(getPageWindow(1, 20)).toEqual([1, 2, 3, 4, 5])
    expect(getPageWindow(20, 20)).toEqual([16, 17, 18, 19, 20])
  })

  it('결과가 없으면 페이지 번호도 없다', () => {
    expect(getPageWindow(1, 0)).toEqual([])
  })
})
