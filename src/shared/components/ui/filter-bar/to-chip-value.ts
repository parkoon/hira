/**
 * 기본값이면 칩을 숨긴다(빈 배열 = 미적용).
 * 기본값이 있는 단일선택 필드에서 쓴다 — 기본값 선택도 칩 제거와 같게 정규화된다.
 */
export const toChipValue = (value: string, defaultValue: string) =>
  value === defaultValue ? [] : [value]
