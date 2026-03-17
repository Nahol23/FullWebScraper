export function parseJson<T>(value: string | null): T | undefined {
  if (value === null) return undefined
  return JSON.parse(value) as T
}

export function toJson(value: unknown): string | null {
  if (value === undefined || value === null) return null
  return JSON.stringify(value)
}