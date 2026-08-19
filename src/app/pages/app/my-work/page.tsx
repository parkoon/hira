import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { getTasksQueryOptions } from '@/features/tasks/api/get-tasks'
import { selectMyTurnItems } from '@/features/tasks/utils/my-turn'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Page } from '@/shared/components/ui/layout/page'

import { MyWorkTable } from './_components/my-work-table'

/**
 * 내 할 일 — 지금 나만 움직일 수 있는 것들의 인박스 (승인 대기함의 전 역할 일반화).
 * 특히 인수 테스트중은 등록자 본인만 전이할 수 있어, 본인이 모르면 흐름 전체가 멈춘다.
 */
function MyWorkPage() {
  const { user } = useCurrentUser()
  const tasksQuery = useSuspenseQuery(getTasksQueryOptions())

  const items = useMemo(() => selectMyTurnItems(tasksQuery.data, user), [tasksQuery.data, user])

  return (
    <Page
      className="overflow-y-hidden"
      noContentPadding
    >
      <p className="text-muted-foreground mb-3 px-4 pt-4 text-[13px]">
        내 차례인 항목 <span className="text-foreground font-semibold">{items.length}건</span> —
        여기 있는 일은 내가 움직여야 다음 단계로 갑니다.
      </p>
      <MyWorkTable items={items} />
    </Page>
  )
}

export { MyWorkPage as Component }
