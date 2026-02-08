import { Detail, ActionPanel, Action } from "@raycast/api";
import { LogEntry, Tenant } from "../utils/types";

interface LogDetailProps {
  log: LogEntry;
  tenant: Tenant;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString();
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\u2502");
}

export default function LogDetail({ log, tenant }: LogDetailProps) {
  const location = [log.location_info?.city_name, log.location_info?.country_name].filter(Boolean).join(", ") || "—";

  const markdown = `# Log Entry

| Field | Value |
|---|---|
| **Log ID** | ${escapeTableCell(log.log_id || "—")} |
| **Type** | ${escapeTableCell(log.type || "—")} |
| **Description** | ${escapeTableCell(log.description || "—")} |
| **Date** | ${formatDate(log.date)} |
| **User** | ${escapeTableCell(log.user_name || log.user_id || "—")} |
| **Client** | ${escapeTableCell(log.client_name || log.client_id || "—")} |
| **Connection** | ${escapeTableCell(log.connection || "—")} |
| **IP** | ${escapeTableCell(log.ip || "—")} |
| **User Agent** | ${escapeTableCell(log.user_agent || "—")} |
| **Location** | ${escapeTableCell(location)} |

## Details

\`\`\`json
${JSON.stringify(log.details, null, 2) || "{}"}
\`\`\`
`;

  const dashboardUrl = `https://${tenant.domain}/admin/logs/${log.log_id || ""}`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={`Log: ${log.type || "Unknown"}`}
      actions={
        <ActionPanel>
          {log.log_id && <Action.CopyToClipboard title="Copy Log ID" content={log.log_id} />}
          {log.user_id && <Action.CopyToClipboard title="Copy User ID" content={log.user_id} />}
          <Action.OpenInBrowser title="Open in Auth0 Dashboard" url={dashboardUrl} />
          <Action.CopyToClipboard title="Copy Log JSON" content={JSON.stringify(log, null, 2)} />
        </ActionPanel>
      }
    />
  );
}
