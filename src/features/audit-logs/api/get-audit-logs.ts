import { queryOptions } from '@tanstack/react-query'
import { format } from 'date-fns'

import type { AuditLog } from '@/features/audit-logs/api/types'
import { supabase } from '@/shared/lib/supabase'

export const getAuditLogsService = async (): Promise<AuditLog[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('occurred_at', { ascending: false })
  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    // 감사 로그는 초 단위까지 보여준다
    occurredAt: format(new Date(row.occurred_at), 'yyyy-MM-dd HH:mm:ss'),
    actorName: row.actor_name,
    eventType: row.event_type,
    targetLabel: row.target_label,
    targetIssueNo: row.target_issue_no,
    detail: row.detail,
    ipAddress: row.ip_address,
  }))
}

export const getAuditLogsQueryKeyPrefix = () => ['/audit-logs'] as const

export const getAuditLogsQueryKey = () => [...getAuditLogsQueryKeyPrefix()] as const

export const getAuditLogsQueryOptions = () =>
  queryOptions({
    queryKey: getAuditLogsQueryKey(),
    queryFn: getAuditLogsService,
    // 로그는 앱 곳곳의 동작이 쌓는다. 어느 뮤테이션이 무효화할지 정하는 대신
    // 화면을 열 때마다 다시 읽어 항상 최신을 보여준다
    staleTime: 0,
  })
