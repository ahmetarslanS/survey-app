export function isEmptyAnswer(value) {
  return (
    value == null ||
    value === '' ||
    (typeof value === 'string' && !value.trim()) ||
    (Array.isArray(value) && value.length === 0)
  )
}
