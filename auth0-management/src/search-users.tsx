import { List, ActionPanel, Action, showToast, Toast, Icon, Color, Image } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { useCachedState } from "@raycast/utils";
import { searchUsers } from "./utils/auth0-client";
import { getActiveTenantConfig, getActiveTenantKey, validateActiveTenant } from "./utils/preferences";
import { User, TenantKey } from "./utils/types";
import UserDetail from "./components/UserDetail";

const TENANT_COLORS: Record<TenantKey, Color> = {
  dev: Color.Green,
  staging: Color.Orange,
  prod: Color.Red,
};

function formatDate(dateString?: string): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export default function SearchUsers() {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useCachedState<User[]>("users", []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantKey = getActiveTenantKey();
  const config = getActiveTenantConfig();

  const doSearch = useCallback(async (term: string) => {
    const validation = validateActiveTenant();
    if (!validation.isValid) {
      setError(validation.error || "Tenant not configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentConfig = getActiveTenantConfig();
      const results = await searchUsers(currentConfig, term);
      setUsers(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search users";
      setError(message);
      showToast({
        style: Toast.Style.Failure,
        title: "Search Failed",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, doSearch]);

  if (error && !users.length) {
    return (
      <List>
        <List.EmptyView icon={Icon.ExclamationMark} title="Configuration Required" description={error} />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search by name, email, or user ID..."
      navigationTitle="Search Users"
      searchBarAccessory={
        <List.Dropdown tooltip="Current Tenant" value={tenantKey} onChange={() => {}}>
          <List.Dropdown.Item title={`${config.name} (${config.domain || "not configured"})`} value={tenantKey} />
        </List.Dropdown>
      }
    >
      {users.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No Users Found"
          description={searchText ? "Try a different search term" : "Start typing to search users"}
        />
      )}
      {users.map((user) => (
        <List.Item
          key={user.user_id}
          icon={user.picture ? { source: user.picture, mask: Image.Mask.Circle } : Icon.Person}
          title={user.email}
          subtitle={user.name}
          accessories={[
            { tag: { value: tenantKey.toUpperCase(), color: TENANT_COLORS[tenantKey] } },
            { text: `Logins: ${user.logins_count ?? 0}` },
            { text: formatDate(user.last_login), tooltip: "Last login" },
            user.blocked ? { icon: { source: Icon.Lock, tintColor: Color.Red }, tooltip: "Blocked" } : {},
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Details"
                icon={Icon.Eye}
                target={<UserDetail user={user} domain={config.domain} />}
              />
              <Action.CopyToClipboard
                title="Copy User ID"
                content={user.user_id}
                shortcut={{ modifiers: ["cmd"], key: "." }}
              />
              <Action.CopyToClipboard
                title="Copy Email"
                content={user.email}
                shortcut={{ modifiers: ["cmd", "shift"], key: "." }}
              />
              <Action.OpenInBrowser
                title="Open in Auth0 Dashboard"
                url={`https://${config.domain}/dashboard/tenant/users/${encodeURIComponent(user.user_id)}`}
                shortcut={{ modifiers: ["cmd"], key: "o" }}
              />
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={() => doSearch(searchText)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
