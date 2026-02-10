import { Detail, ActionPanel, Action } from "@raycast/api";
import { Auth0App, Tenant } from "../utils/types";

interface AppDetailProps {
  app: Auth0App;
  tenant: Tenant;
}

const APP_TYPE_LABELS: Record<string, string> = {
  non_interactive: "Machine to Machine",
  spa: "Single Page App",
  regular_web: "Regular Web App",
  native: "Native",
};

/** Replace pipe characters with a Unicode box-drawing character to avoid breaking markdown tables. */
function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\u2502");
}

function renderUrlList(title: string, urls?: string[]): string {
  if (!urls || urls.length === 0) return "";
  const items = urls.map((u) => `- ${escapeTableCell(u)}`).join("\n");
  return `\n### ${title}\n${items}\n`;
}

/** Detail view showing an Auth0 application's configuration and allowed URLs. */
export default function AppDetail({ app, tenant }: AppDetailProps) {
  const domain = tenant.domain;
  const appTypeLabel = app.app_type ? (APP_TYPE_LABELS[app.app_type] ?? app.app_type) : "—";
  const grantTypes = app.grant_types?.length ? app.grant_types.map((g) => escapeTableCell(g)).join(", ") : "—";

  const metadataSection =
    app.client_metadata && Object.keys(app.client_metadata).length > 0
      ? `\n### Metadata\n${Object.entries(app.client_metadata)
          .map(([k, v]) => `- **${escapeTableCell(k)}**: ${escapeTableCell(v)}`)
          .join("\n")}\n`
      : "";

  const markdown = `# ${app.name ?? "Unnamed App"}

${app.logo_uri ? `![Logo](${app.logo_uri})` : ""}

| Field | Value |
|---|---|
| **Client ID** | ${escapeTableCell(app.client_id)} |
| **Name** | ${app.name ? escapeTableCell(app.name) : "—"} |
| **Description** | ${app.description ? escapeTableCell(app.description) : "—"} |
| **App Type** | ${appTypeLabel} |
| **First Party** | ${app.is_first_party ? "Yes" : "No"} |
| **Token Endpoint Auth** | ${app.token_endpoint_auth_method ? escapeTableCell(app.token_endpoint_auth_method) : "—"} |
| **Grant Types** | ${grantTypes} |
${renderUrlList("Callbacks", app.callbacks)}${renderUrlList("Allowed Origins", app.allowed_origins)}${renderUrlList("Web Origins", app.web_origins)}${renderUrlList("Allowed Logout URLs", app.allowed_logout_urls)}${metadataSection}`;

  const dashboardUrl = `https://${domain}/admin/applications/${app.client_id}/settings`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={app.name ?? "App Detail"}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Client ID" content={app.client_id} />
          <Action.OpenInBrowser title="Open in Auth0 Dashboard" url={dashboardUrl} />
          <Action.CopyToClipboard title="Copy App JSON" content={JSON.stringify(app, null, 2)} />
        </ActionPanel>
      }
    />
  );
}
