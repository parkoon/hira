import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import type { TaskTreePageMeta } from '@/features/tasks/api/types'
import { Button } from '@/shared/components/ui/button'

import { getPageWindow } from '../_utils/page-window'

type TaskTreePagerProps = {
  page: TaskTreePageMeta | undefined
  /** 전환 중에는 연타를 막는다 — 이전 페이지가 그려진 채로 버튼만 살아 있으면 헷갈린다 */
  disabled: boolean
  onPageChange: (page: number) => void
}

/**
 * 그리드 바깥의 페이저. 페이징 단위가 상위 작업이라 화면의 행 수와 건수가 다르므로,
 * 카운트에 '상위 작업'이라는 단위를 반드시 붙인다 — 그 차이를 설명해 주는 유일한 장치다.
 */
export function TaskTreePager({ page, disabled, onPageChange }: TaskTreePagerProps) {
  if (!page) return null

  const pageNumbers = getPageWindow(page.number, page.totalPages)

  return (
    <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
      <span className="text-muted-foreground text-xs">상위 작업 {page.totalParents}건</span>

      {page.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground mr-1 text-xs">
            {page.number} / {page.totalPages} 페이지
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || page.number <= 1}
            onClick={() => onPageChange(page.number - 1)}
          >
            <ChevronLeftIcon />
            이전
          </Button>
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page.number ? 'outline-primary' : 'ghost'}
              size="sm"
              className="min-w-6"
              disabled={disabled}
              aria-current={pageNumber === page.number ? 'page' : undefined}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || page.number >= page.totalPages}
            onClick={() => onPageChange(page.number + 1)}
          >
            다음
            <ChevronRightIcon />
          </Button>
        </div>
      )}
    </div>
  )
}
