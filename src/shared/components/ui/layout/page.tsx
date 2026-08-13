import type * as React from 'react'

import { cn } from '@/shared/utils/cn'

type PageProps = {
  children: React.ReactNode
  /** 우측 상단 액션 영역 (예: 이슈 등록 버튼) */
  action?: React.ReactNode
  /**
   * 콘텐츠가 화면 끝까지 닿아야 할 때 children 여백을 끈다.
   * action 영역의 여백은 그대로 유지된다.
   */
  noContentPadding?: boolean
  className?: string
}

/**
 * 라우트 페이지의 바깥 껍데기.
 * 현재 위치는 사이드바가 알려주므로 페이지 제목은 두지 않는다.
 *
 * 기본은 페이지 자체가 세로 스크롤한다. 표가 남은 높이를 채워야 하는 화면은
 * `className="overflow-y-hidden"`으로 페이지 스크롤을 끄고 표에 `flex-1`을 준다.
 */
export function Page({ children, action, noContentPadding, className }: PageProps) {
  return (
    <main className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto', className)}>
      {action && <div className="flex shrink-0 justify-end p-2 pb-3">{action}</div>}
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          !noContentPadding && 'p-4',
          // action이 이미 위쪽 여백을 만들었으므로 중복을 피한다
          !noContentPadding && action && 'pt-0'
        )}
      >
        {children}
      </div>
    </main>
  )
}
