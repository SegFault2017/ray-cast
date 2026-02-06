import { Detail, ActionPanel, Action } from "@raycast/api";
import { User } from "../utils/types";

interface UserDetailProps {
  user: User;
  domain: string;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleString();
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\u2502");
}

export default function UserDetail({ user, domain }: UserDetailProps) {
  const identities =
    user.identities && user.identities.length > 0
      ? user.identities
          .map((id) => `${escapeTableCell(id.provider)} ${escapeTableCell(id.connection)}${id.isSocial ? " (Social)" : ""}`)
          .join(", ")
      : "None";

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
`;

  const dashboardUrl = `https://${domain}/dashboard/tenant/users/${encodeURIComponent(user.user_id)}`;

  return (
    <Detail
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
