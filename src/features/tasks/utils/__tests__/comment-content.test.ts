import { describe, expect, it } from 'vitest'

import {
  extractMentionIds,
  htmlToText,
  linkifyTaskNumbers,
} from '@/features/tasks/utils/comment-content'

describe('htmlToText', () => {
  it('태그를 걷어내고 텍스트만 남긴다', () => {
    expect(htmlToText('<p>검토 <strong>부탁</strong>드립니다</p>')).toBe('검토 부탁드립니다')
  })
})

describe('extractMentionIds', () => {
  it('멘션 노드의 data-id를 중복 없이 모은다', () => {
    const html =
      '<p><span data-type="mention" data-id="user-1">@임도윤</span> 확인 요청. ' +
      '<span data-type="mention" data-id="user-2">@최유진</span>도 참고. ' +
      '<span data-type="mention" data-id="user-1">@임도윤</span></p>'

    expect(extractMentionIds(html)).toEqual(['user-1', 'user-2'])
  })

  it('멘션이 없으면 빈 배열이다', () => {
    expect(extractMentionIds('<p>멘션 없는 댓글</p>')).toEqual([])
  })
})

describe('linkifyTaskNumbers', () => {
  it('작업번호를 상세 링크로 바꾼다', () => {
    const result = linkifyTaskNumbers('<p>WR-2026-0001 확인 부탁드립니다</p>')

    expect(result).toBe(
      '<p><a href="/app/tasks/WR-2026-0001" data-task-link="">WR-2026-0001</a> 확인 부탁드립니다</p>'
    )
  })

  it('하위작업번호는 부모 번호를 낀 경로로 링크한다', () => {
    const result = linkifyTaskNumbers('<p>WR-2026-0001-01 진행 상황?</p>')

    expect(result).toContain('href="/app/tasks/WR-2026-0001/subtasks/WR-2026-0001-01"')
  })

  it('한 문단의 여러 번호를 각각 링크한다', () => {
    const result = linkifyTaskNumbers('<p>WR-2026-0001과 WR-2026-0002 둘 다</p>')

    expect(result).toContain('href="/app/tasks/WR-2026-0001"')
    expect(result).toContain('href="/app/tasks/WR-2026-0002"')
    expect(result).toContain('과 ')
  })

  it('이미 링크이거나 멘션인 부분은 건드리지 않는다', () => {
    const linked = '<p><a href="https://example.com">WR-2026-0001</a></p>'
    const mentioned = '<p><span data-type="mention" data-id="u1">WR-2026-0001</span></p>'

    expect(linkifyTaskNumbers(linked)).toBe(linked)
    expect(linkifyTaskNumbers(mentioned)).toBe(mentioned)
  })

  it('번호가 없으면 그대로 돌려준다', () => {
    expect(linkifyTaskNumbers('<p>번호 없는 댓글</p>')).toBe('<p>번호 없는 댓글</p>')
  })
})
