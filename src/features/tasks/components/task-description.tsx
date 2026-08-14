import DOMPurify from 'dompurify'
import { useMemo } from 'react'

import { cn } from '@/shared/utils/cn'

/**
 * 리치텍스트로 저장된 상세내용 렌더링.
 *
 * 저장은 Tiptap이 만든 HTML을 그대로 넣고, DB는 문자열로만 다룬다 — 중간에 걸러주는 계층이 없다.
 * RLS가 로그인 사용자에게 테이블을 통째로 열어두고 있어 화면을 거치지 않고 값을 넣을 수 있으므로,
 * 읽는 쪽에서 반드시 새니타이즈한다.
 */
export function TaskDescription({ html, className }: { html: string; className?: string }) {
  const safeHtml = useMemo(() => DOMPurify.sanitize(html), [html])

  return (
    <div
      className={cn(
        'text-[13px] leading-relaxed',
        '[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5',
        '[&_a]:text-blue-700 [&_a]:underline dark:[&_a]:text-blue-400 [&_p]:my-1',
        '[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]',
        className
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
