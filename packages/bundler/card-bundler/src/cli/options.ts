export function objectifyOption(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export function normalizeObjectOptionValue(optionValue: unknown,
  objectifyValue: (value: unknown) => Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!optionValue)
    return optionValue as undefined

  if (Array.isArray(optionValue)) {
    return optionValue.reduce(
      (result, value) => value && result && { ...result, ...objectifyValue(value) },
      {},
    )
  }
  return objectifyValue(optionValue)
}
