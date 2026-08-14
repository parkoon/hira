import type { ReactNode } from 'react'

import {
  type BreadcrumbEntry,
  IssueBreadcrumb,
} from '@/features/issues/components/issue-breadcrumb'

type IssueDetailHeaderProps = {
  breadcrumb: BreadcrumbEntry[]
  title: string
  /**
   * 레코드 자체를 손대는 액션("..." 메뉴) — 브레드크럼 행 오른쪽 끝.
   * 헤더의 액션 자리는 여기 하나뿐이다. 상태를 바꾸는 것은 우측 패널의 진행 상태 카드가,
   * 섹션에 속한 것은 그 섹션 헤더가 맡는다.
   */
  actions?: ReactNode
}

/**
 * 이슈·하위작업 상세의 머리말 (Jira 신규 이슈 뷰 배치).
 * 본문을 내려도 현재 위치와 주요 액션이 보이도록 본문 컬럼 상단에 고정된다.
 */
export function IssueDetailHeader({ breadcrumb, title, actions }: IssueDetailHeaderProps) {
  return (
    // z-20인 이유: 본문 위로 겹쳐 내려도 스크롤 콘텐츠를 가리도록 위에 있어야 한다
    <div className="bg-background sticky top-0 z-20 space-y-2 py-3">
      <div className="flex items-center justify-between gap-2">
        <IssueBreadcrumb items={breadcrumb} />
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
    </div>
  )
}
