import type { EnumOption } from '@/shared/utils/enum'

import type { FilterBarField } from './types'

export type FilterMenuItem =
  | { type: 'field'; field: FilterBarField }
  | { type: 'value'; field: FilterBarField; option: EnumOption }

export function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

/** 칩에 표시할 선택 값 요약. 2개까지는 나열, 그 이상은 `첫 값 외 n`. */
export function summarizeSelection(field: FilterBarField, selected: string[]): string {
  const labels = selected.map(
    (value) => field.options.find((option) => option.value === value)?.label ?? value
  )
  if (labels.length <= 2) return labels.join(', ')
  return `${labels[0]} 외 ${labels.length - 1}`
}

/**
 * 필터 메뉴에 표시할 항목 목록.
 * 값 목록 모드(activeField)면 해당 필드의 값만, 필드 목록 모드에서
 * 검색어가 있으면 필드와 함께 모든 필드의 값 항목도 찾아준다.
 */
export function buildFilterMenuItems(
  fields: FilterBarField[],
  activeField: FilterBarField | null,
  query: string
): FilterMenuItem[] {
  const normalizedQuery = query.trim().toLowerCase()
  const matches = (label: string) => label.toLowerCase().includes(normalizedQuery)

  if (activeField) {
    return activeField.options
      .filter((option) => matches(option.label))
      .map((option) => ({ type: 'value', field: activeField, option }))
  }

  const fieldItems = fields
    .filter((field) => matches(field.label))
    .map((field): FilterMenuItem => ({ type: 'field', field }))
  if (!normalizedQuery) return fieldItems

  const valueItems = fields.flatMap((field) =>
    field.options
      .filter((option) => matches(option.label))
      .map((option): FilterMenuItem => ({ type: 'value', field, option }))
  )
  return [...fieldItems, ...valueItems]
}
