export function toFiniteMetricOrNull(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function toIntegerMetricOrNull(value) {
  const number = toFiniteMetricOrNull(value);
  return number !== null && Number.isInteger(number) ? number : null;
}
