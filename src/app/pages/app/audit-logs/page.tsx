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
      action={
        <Button
          variant="outline"
          onClick={() => exportAuditLogsCsv(logs)}
        >
          <DownloadIcon />
          CSV 내보내기
        </Button>
      }
      noContentPadding
    >
      <div className="mb-3 px-2">
        <AuditLogFilters actors={actors} />
      </div>
      <AuditLogsTable logs={logs} />
    </Page>
  )
}

export { AuditLogPage as Component }
