import { Link } from 'react-router'

import { cn } from '@/shared/utils/cn'

type IssueKeyLinkProps = {
  to: string
  children: React.ReactNode
  className?: string
}

/** 이슈 번호 링크. Jira의 이슈 키와 동일하게 링크 색으로 구분한다. */
export function IssueKeyLink({ to, children, className }: IssueKeyLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'font-medium whitespace-nowrap text-blue-700 hover:underline dark:text-blue-400',
        className
      )}
    >
      {children}
    </Link>
  )
}
