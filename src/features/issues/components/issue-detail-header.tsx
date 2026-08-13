import type { ReactNode } from 'react'

import {
  type BreadcrumbEntry,
  IssueBreadcrumb,
} from '@/features/issues/components/issue-breadcrumb'

type IssueDetailHeaderProps = {
  breadcrumb: BreadcrumbEntry[]
  title: string
  /** 이슈 수준 액션("..." 메뉴 등) — Jira처럼 브레드크럼 행 오른쪽 끝 */
  actions?: ReactNode
  /** 본문 quick-add 아이콘 버튼 줄 — Jira처럼 제목 아래 */
  quickActions?: ReactNode
}

/**
 * 이슈·하위작업 상세의 머리말 (Jira 신규 이슈 뷰 배치).
 * 본문을 내려도 현재 위치와 주요 액션이 보이도록 본문 컬럼 상단에 고정된다.
 */
export function IssueDetailHeader({
  breadcrumb,
  title,
  actions,
  quickActions,
}: IssueDetailHeaderProps) {
  return (
    // z-20인 이유: 본문 위로 겹쳐 내려도 스크롤 콘텐츠를 가리도록 위에 있어야 한다
    <div className="bg-background sticky top-0 z-20 space-y-2 py-3">
      <div className="flex items-center justify-between gap-2">
        <IssueBreadcrumb items={breadcrumb} />
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      {/* empty:hidden — 상태에 따라 액션이 하나도 안 뜨는 화면에서 빈 줄이 남지 않게 한다 */}
      {quickActions && (
        <div className="flex flex-wrap items-center gap-1.5 empty:hidden">{quickActions}</div>
      )}
    </div>
  )
}
