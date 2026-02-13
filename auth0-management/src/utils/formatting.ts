/** Replace pipe characters with a Unicode box-drawing character to avoid breaking markdown tables. */
export function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\u2502");
}

/** Format an ISO date string as a localized date (date-only), or a fallback string if absent. */
export function formatDate(dateString?: string, fallback = "Never"): string {
  if (!dateString) return fallback;
  return new Date(dateString).toLocaleDateString();
}

/** Format an ISO date string as a localized date+time, or a fallback string if absent. */
export function formatDateTime(dateString?: string, fallback = "\u2014"): string {
  if (!dateString) return fallback;
  return new Date(dateString).toLocaleString();
}

/** Human-readable labels for Auth0 application types. */
export const APP_TYPE_LABELS: Record<string, string> = {
  non_interactive: "Machine to Machine",
  spa: "Single Page App",
  regular_web: "Regular Web App",
  native: "Native",
};
