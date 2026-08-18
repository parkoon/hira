/**
 * 페이저에 보여줄 페이지 번호 창. 총 페이지가 많아도 버튼 수를 `size`개로 묶고,
 * 현재 페이지를 가운데 두되 양 끝에서는 창을 안쪽으로 민다.
 */
export function getPageWindow(current: number, totalPages: number, size = 5): number[] {
  if (totalPages <= 0) return []

  const windowSize = Math.min(size, totalPages)
  const start = Math.min(
    Math.max(current - Math.floor(windowSize / 2), 1),
    totalPages - windowSize + 1
  )

  return Array.from({ length: windowSize }, (_, index) => start + index)
}
