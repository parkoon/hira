import { useSuspenseQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import { getRequestsQueryOptions } from '@/features/issues/api/get-requests'
import { selectVisibleRequests } from '@/features/issues/utils/issue-selectors'
import { useCurrentUser } from '@/features/users/hooks/use-current-user'
import { Page } from '@/shared/components/ui/layout/page'

import { RequestListFilters } from './_components/request-list-filters'
import { RequestsTable } from './_components/requests-table'
import { applyRequestListFilters, requestListFilterParsers } from './_utils/request-list-filters'

/** 화면 2 — 이슈 목록 (스펙 §6-2) */
function RequestListPage() {
  const { user } = useCurrentUser()
  const [filters] = useQueryStates(requestListFilterParsers)
  const requestsQuery = useSuspenseQuery(getRequestsQueryOptions())

  const requests = useMemo(
    () => applyRequestListFilters(selectVisibleRequests(requestsQuery.data, user), filters),
    [requestsQuery.data, user, filters]
  )

  return (
    <Page noContentPadding>
      <div className="mb-3 px-2 pt-3">
        <RequestListFilters />
      </div>
      <RequestsTable requests={requests} />
    </Page>
  )
}

export { RequestListPage as Component }
