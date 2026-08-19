import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import { TaskDescription } from '@/features/tasks/components/task-description'
import { linkifyTaskNumbers } from '@/features/tasks/utils/comment-content'
import { cn } from '@/shared/utils/cn'

/**
 * 댓글 본문 렌더 — 새니타이즈는 TaskDescription이 하고, 여기서는 두 가지를 얹는다.
 * 작업번호를 상세 링크로 바꾸고(Jira의 이슈 키 오토링크), 멘션 노드를 칩으로 그린다.
 * 링크는 dangerouslySetInnerHTML 안이라 라우터 Link가 될 수 없어, 클릭을 가로채
 * SPA 이동으로 바꾼다 — 보조키가 눌린 클릭(새 탭 등)은 브라우저에 맡긴다.
 */
export function CommentBody({ html }: { html: string }) {
  const navigate = useNavigate()
  const linked = useMemo(() => linkifyTaskNumbers(html), [html])

  const handleClick = (event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    const anchor = (event.target as HTMLElement).closest('a[data-task-link]')
    if (!(anchor instanceof HTMLAnchorElement)) return

    event.preventDefault()
    void navigate(anchor.getAttribute('href') ?? '')
  }

  return (
    // 실제 상호작용 대상은 안쪽의 네이티브 앵커라 키보드 접근도 앵커가 맡는다
    <div onClick={handleClick}>
      <TaskDescription
        html={linked}
        className={cn(
          '[&_[data-type=mention]]:bg-primary/10 [&_[data-type=mention]]:text-primary',
          '[&_[data-type=mention]]:rounded [&_[data-type=mention]]:px-1 [&_[data-type=mention]]:py-0.5',
          '[&_[data-type=mention]]:text-[0.9em] [&_[data-type=mention]]:font-medium'
        )}
      />
    </div>
  )
}
