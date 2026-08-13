import { format } from 'date-fns'

import type { AuditLog } from '@/features/audit-logs/api/types'
import { AUDIT_EVENT_META } from '@/features/audit-logs/constants/metadata'

const HEADERS = ['일시', '행위자', '이벤트', '대상', '상세', 'IP'] as const

function toCsvCell(value: string) {
  // =, +, -, @, 탭, CR로 시작하는 셀은 Excel이 수식으로 실행한다(CWE-1236) —
  // 하위작업 제목·첨부파일명 등 사용자 입력이 그대로 들어오므로 텍스트로 강제한다
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

/** 감사 로그 CSV 내보내기 — 스펙 §11.4 */
export function exportAuditLogsCsv(logs: AuditLog[]) {
  const rows = logs.map((log) =>
    [
      log.occurredAt,
      log.actorName,
      AUDIT_EVENT_META[log.eventType].label,
      log.targetLabel ?? '',
      log.detail ?? '',
      log.ipAddress,
    ]
      .map(toCsvCell)
      .join(',')
  )

  // Excel이 UTF-8로 인식하도록 BOM을 앞에 붙인다
  const csv = `\uFEFF${[HEADERS.join(','), ...rows].join('\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))

  const link = document.createElement('a')
  link.href = url
  link.download = `audit-logs-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`
  link.click()

  // click() 직후 동기로 해제하면 브라우저가 내려받기를 시작하기 전에 URL이 사라질 수 있다
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
