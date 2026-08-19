import { ReactRenderer } from '@tiptap/react'
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

import { NameAvatar } from '@/shared/components/ui/name-avatar'
import { cn } from '@/shared/utils/cn'

/** @로 부를 수 있는 구성원 — 호출 측이 열람 권한 있는 범위(작업자 이상)로 걸러 넘긴다 */
export type MentionCandidate = {
  id: string
  name: string
  dept: string
}

/** 멘션 노드 attrs와 이름을 맞춘다 — label이 본문에 @라벨로 박힌다 */
type MentionItem = {
  id: string
  label: string
  dept: string
}

type MentionListHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

/**
 * ReactRenderer가 ref를 붙여 주는 건 forwardRef 컴포넌트뿐이다 —
 * 키보드 내비게이션이 이 ref를 타므로 plain 함수 컴포넌트로 바꾸면 안 된다.
 */
// eslint-disable-next-line react-refresh/only-export-components -- ReactRenderer로 직접 마운트되는 내부 컴포넌트라 fast refresh 대상이 아니다
const MentionList = forwardRef<MentionListHandle, SuggestionProps<MentionItem>>(
  function MentionList({ items, command }, ref) {
    const [selected, setSelected] = useState(0)

    // 타이핑으로 후보가 줄면 선택 위치가 목록 밖에 남을 수 있다
    useEffect(() => setSelected(0), [items])

    const select = (index: number) => {
      const item = items[index]
      if (item) command(item)
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (items.length === 0) return false
        if (event.key === 'ArrowDown') {
          setSelected((current) => (current + 1) % items.length)
          return true
        }
        if (event.key === 'ArrowUp') {
          setSelected((current) => (current - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          select(selected)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) return null

    return (
      <div className="bg-popover text-popover-foreground w-64 rounded-md border p-1 shadow-md">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              'flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-[13px]',
              index === selected && 'bg-muted'
            )}
            onMouseEnter={() => setSelected(index)}
            onClick={() => select(index)}
          >
            <NameAvatar name={item.label} />
            <span className="font-medium">{item.label}</span>
            <span className="text-muted-foreground text-xs">{item.dept}</span>
          </button>
        ))}
      </div>
    )
  }
)

/**
 * Mention 확장에 꽂는 @ 자동완성 — 이름으로 거르고 6명까지 보여준다.
 * 위치 잡기용 라이브러리(tippy) 없이 캐럿 좌표에 fixed로 띄운다.
 */
export function createMentionSuggestion(
  candidates: MentionCandidate[]
): Omit<SuggestionOptions<MentionItem>, 'editor'> {
  return {
    items: ({ query }) =>
      candidates
        .filter((candidate) => candidate.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6)
        .map((candidate) => ({
          id: candidate.id,
          label: candidate.name,
          dept: candidate.dept,
        })),

    render: () => {
      let renderer: ReactRenderer<MentionListHandle, SuggestionProps<MentionItem>>

      const position = (clientRect: SuggestionProps<MentionItem>['clientRect']) => {
        const rect = clientRect?.()
        if (!rect) return
        const element = renderer.element
        element.style.position = 'fixed'
        element.style.top = `${rect.bottom + 4}px`
        element.style.left = `${rect.left}px`
        element.style.zIndex = '50'
      }

      return {
        onStart: (props) => {
          renderer = new ReactRenderer(MentionList, { props, editor: props.editor })
          document.body.appendChild(renderer.element)
          position(props.clientRect)
        },
        onUpdate: (props) => {
          renderer.updateProps(props)
          position(props.clientRect)
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            // 플러그인은 @ 뒤 텍스트가 남아 있는 동안 세션을 유지한다 — 목록만 감춘다
            renderer.element.style.display = 'none'
            return true
          }
          return renderer.ref?.onKeyDown(props) ?? false
        },
        onExit: () => {
          renderer.element.remove()
          renderer.destroy()
        },
      }
    },
  }
}
