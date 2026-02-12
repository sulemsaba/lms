/**
 * Converts MB values to display text.
 */
export function formatMegabytes(value: number): string {
  return `${value.toFixed(1)} MB`;
}

/**
 * Formats queue counts for compact display.
 */
export function formatCount(value: number): string {
  return new Intl.NumberFormat().format(value);
}
