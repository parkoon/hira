import { paths } from '@/shared/config/paths'

/**
 * 댓글 본문(HTML)을 다루는 순수 유틸.
 * 저장 형식은 Tiptap이 만든 HTML이고, 멘션은 `<span data-type="mention" data-id="...">`,
 * 작업번호 링크는 렌더 직전 `linkifyTaskNumbers`가 만든 `<a data-task-link>`다.
 */

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html')

/** 알림 미리보기 등 문장이 필요한 곳 — 태그를 걷어낸 순수 텍스트 */
export function htmlToText(html: string): string {
  return parse(html).body.textContent ?? ''
}

/** 본문에서 언급된 사용자 id (중복 제거). 멘션 노드의 data-id가 profiles.id다 */
export function extractMentionIds(html: string): string[] {
  const ids = [...parse(html).querySelectorAll('[data-type="mention"][data-id]')]
    .map((element) => element.getAttribute('data-id'))
    .filter((id): id is string => id !== null && id.length > 0)
  return [...new Set(ids)]
}

/** 작업번호 WR-YYYY-NNNN, 하위작업번호 WR-YYYY-NNNN-NN — 대화에서 번호로 부르는 그 형식 */
const TASK_NO_PATTERN = /WR-\d{4}-\d{4}(?:-\d{2})?/g

const toTaskHref = (key: string) => {
  // 꼬리 두 자리가 더 붙어 있으면 하위작업이다 — 상세 경로는 부모 번호가 있어야 열린다
  const isSubtask = /-\d{2}$/.test(key.slice('WR-0000-0000'.length))
  return isSubtask
    ? paths.app.tasks.subtask.getHref(key.slice(0, -3), key)
    : paths.app.tasks.detail.getHref(key)
}

/**
 * 본문 텍스트의 작업번호를 상세 링크로 바꾼다 (Jira의 이슈 키 오토링크).
 * 텍스트 노드만 건드린다 — 이미 링크이거나 멘션인 부분은 그대로 둔다.
 * SPA 이동은 렌더 측(`CommentBody`)이 data-task-link 앵커의 클릭을 가로채 처리한다.
 */
export function linkifyTaskNumbers(html: string): string {
  const doc = parse(html)
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)

  const targets: Text[] = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node as Text
    if (!text.data.match(TASK_NO_PATTERN)) continue
    if (text.parentElement?.closest('a, [data-type="mention"]')) continue
    targets.push(text)
  }

  for (const text of targets) {
    const fragment = doc.createDocumentFragment()
    let cursor = 0
    for (const match of text.data.matchAll(TASK_NO_PATTERN)) {
      const index = match.index ?? 0
      if (index > cursor) fragment.append(doc.createTextNode(text.data.slice(cursor, index)))

      const anchor = doc.createElement('a')
      anchor.setAttribute('href', toTaskHref(match[0]))
      anchor.setAttribute('data-task-link', '')
      anchor.textContent = match[0]
      fragment.append(anchor)

      cursor = index + match[0].length
    }
    if (cursor < text.data.length) fragment.append(doc.createTextNode(text.data.slice(cursor)))
    text.replaceWith(fragment)
  }

  return doc.body.innerHTML
}
