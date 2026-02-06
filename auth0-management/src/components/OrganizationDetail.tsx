import { Detail, ActionPanel, Action } from "@raycast/api";
import { Organization } from "../utils/types";

interface OrganizationDetailProps {
  organization: Organization;
  domain: string;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\u2502");
}

export default function OrganizationDetail({ organization, domain }: OrganizationDetailProps) {
  const metadataKeys =
    organization.metadata && Object.keys(organization.metadata).length > 0
      ? Object.entries(organization.metadata)
          .map(([k, v]) => `${escapeTableCell(k)}: ${escapeTableCell(v)}`)
          .join(", ")
      : "—";

  const brandingColors =
    organization.branding?.colors
      ? [organization.branding.colors.primary, organization.branding.colors.page_background].filter(Boolean).join(", ")
      : "—";

  const markdown = `# ${organization.display_name || organization.name}

${organization.branding?.logo_url ? `![Logo](${organization.branding.logo_url})` : ""}

| Field | Value |
|---|---|
| **ID** | ${escapeTableCell(organization.id)} |
| **Name** | ${escapeTableCell(organization.name)} |
| **Display Name** | ${organization.display_name ? escapeTableCell(organization.display_name) : "—"} |
| **Branding Logo** | ${organization.branding?.logo_url ? escapeTableCell(organization.branding.logo_url) : "—"} |
| **Branding Colors** | ${brandingColors} |
| **Metadata** | ${metadataKeys} |
`;

  const dashboardUrl = `https://${domain}/admin/organizations/${organization.id}/overview`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle={organization.display_name || organization.name}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Org ID" content={organization.id} />
          <Action.CopyToClipboard title="Copy Org Name" content={organization.name} />
          <Action.OpenInBrowser title="Open in Auth0 Dashboard" url={dashboardUrl} />
          <Action.CopyToClipboard title="Copy Org JSON" content={JSON.stringify(organization, null, 2)} />
        </ActionPanel>
      }
    />
  );
}
