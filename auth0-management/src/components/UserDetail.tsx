import { Detail, ActionPanel, Action } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { Tenant, User } from "../utils/types";
import { getUserOrganizations } from "../utils/auth0-client";

interface UserDetailProps {
  user: User;
  tenant: Tenant;
}

/** Format an ISO date string as a localized date+time, or "Never" if absent. */
function formatDate(dateString?: string): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleString();
}

/** Replace pipe characters with a Unicode box-drawing character to avoid breaking markdown tables. */
function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\u2502");
}

/** Detail view showing a user's full profile, identities, and organization memberships. */
export default function UserDetail({ user, tenant }: UserDetailProps) {
  const { data: organizations, isLoading } = usePromise(getUserOrganizations, [tenant, user.user_id]);

  const identities =
    user.identities && user.identities.length > 0
      ? user.identities
          .map(
            (id) =>
              `${escapeTableCell(id.provider)} ${escapeTableCell(id.connection)}${id.isSocial ? " (Social)" : ""}`,
          )
          .join(", ")
      : "None";

  let orgsSection: string;
  if (isLoading) {
    orgsSection = "Loading...";
  } else if (organizations && organizations.length > 0) {
    orgsSection = organizations.map((org) => `- ${org.display_name || org.name} (\`${org.id}\`)`).join("\n");
  } else {
    orgsSection = "None";
  }

  const markdown = `# ${user.name || user.email}

${user.picture ? `![Avatar](${user.picture})` : ""}

| Field | Value |
|---|---|
| **User ID** | ${escapeTableCell(user.user_id)} |
| **Email** | ${user.email} ${user.email_verified ? "✓" : "(unverified)"} |
| **Name** | ${user.name || "—"} |
| **Nickname** | ${user.nickname || "—"} |
| **Created** | ${formatDate(user.created_at)} |
| **Last Login** | ${formatDate(user.last_login)} |
| **Last IP** | ${user.last_ip || "—"} |
| **Login Count** | ${user.logins_count ?? 0} |
| **Blocked** | ${user.blocked ? "Yes" : "No"} |
| **Identities** | ${identities} |

## Organizations

${orgsSection}
`;

  const dashboardUrl = `https://${tenant.domain}/dashboard/tenant/users/${encodeURIComponent(user.user_id)}`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      navigationTitle={user.email}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy User ID" content={user.user_id} />
          <Action.CopyToClipboard title="Copy Email" content={user.email} />
          <Action.OpenInBrowser title="Open in Auth0 Dashboard" url={dashboardUrl} />
          <Action.CopyToClipboard title="Copy User JSON" content={JSON.stringify(user, null, 2)} />
        </ActionPanel>
      }
    />
  );
}
