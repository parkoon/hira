export type EnumTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

export type EnumMetadata = {
  label: string
  order: number
  description?: string
  tone?: EnumTone
}

export type EnumMetadataMap = Record<string, EnumMetadata>
type EnumValue<Meta extends EnumMetadataMap> = Extract<keyof Meta, string>

export type EnumOption<Value extends string = string> = {
  value: Value
  label: string
}

export function toEnumOptions<
  const Meta extends EnumMetadataMap,
  const Value extends EnumValue<Meta> = EnumValue<Meta>,
>(meta: Meta, values?: readonly Value[]): EnumOption<Value>[] {
  const enumValues = values ?? (Object.keys(meta) as Value[])
  return [...enumValues]
    .sort((left, right) => meta[left].order - meta[right].order)
    .map((value) => ({ value, label: meta[value].label }))
}

export function isKnownEnumValue<const Meta extends EnumMetadataMap>(
  meta: Meta,
  value: string
): value is EnumValue<Meta> {
  return Object.prototype.hasOwnProperty.call(meta, value)
}

export function getEnumLabel<const Meta extends EnumMetadataMap>(
  meta: Meta,
  value: string | null | undefined,
  fallback = ''
) {
  if (!value) return fallback
  return isKnownEnumValue(meta, value) ? meta[value].label : fallback
}
