import { useSuspenseQuery } from '@tanstack/react-query'
import { DownloadIcon } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'

import { getAuditLogsQueryOptions } from '@/features/audit-logs/api/get-audit-logs'
import { Button } from '@/shared/components/ui/button'
import { Page } from '@/shared/components/ui/layout/page'

import { AuditLogFilters } from './_components/audit-log-filters'
import { AuditLogsTable } from './_components/audit-logs-table'
import { applyAuditLogFilters, auditLogFilterParsers } from './_utils/audit-log-filters'
import { exportAuditLogsCsv } from './_utils/export-audit-logs-csv'

/** 화면 11 — 감사 로그 (관리자, 스펙 §6-9). audit_logs 단일 테이블 조회 */
function AuditLogPage() {
  const [filters] = useQueryStates(auditLogFilterParsers)
  const auditLogsQuery = useSuspenseQuery(getAuditLogsQueryOptions())

  const logs = useMemo(
    () => applyAuditLogFilters(auditLogsQuery.data, filters),
    [auditLogsQuery.data, filters]
  )
  const actors = useMemo(
    () => [...new Set(auditLogsQuery.data.map((log) => log.actorName))],
    [auditLogsQuery.data]
  )

  return (
    <Page
      className="overflow-y-hidden"
      noContentPadding
    >
      {/* 필터가 늘면 왼쪽만 가로로 흐르고 내보내기 버튼은 오른쪽에 붙어 있는다 */}
      <div className="mb-3 flex items-center justify-between gap-2 px-2 pt-3">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <AuditLogFilters actors={actors} />
        </div>
        <Button
          variant="outline"
          onClick={() => exportAuditLogsCsv(logs)}
        >
          <DownloadIcon />
          CSV 내보내기
        </Button>
      </div>
      <AuditLogsTable logs={logs} />
    </Page>
  )
}

export { AuditLogPage as Component }
