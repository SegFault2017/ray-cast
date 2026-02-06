import { List, ActionPanel, Action, showToast, Toast, Icon, Color, Image } from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCachedState } from "@raycast/utils";
import { searchUsers } from "./utils/auth0-client";
import { getTenantConfig } from "./utils/preferences";
import { useActiveTenant } from "./utils/use-active-tenant";
import { User, TenantKey } from "./utils/types";
import UserDetail from "./components/UserDetail";

const TENANT_COLORS: Record<TenantKey, Color> = {
  dev: Color.Green,
  staging: Color.Orange,
  prod: Color.Red,
};

const ALL_TENANTS: { key: TenantKey; label: string }[] = [
  { key: "dev", label: "Development" },
  { key: "staging", label: "Staging" },
  { key: "prod", label: "Production" },
];

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
  const { tenantKey, tenantConfig, switchTenant, isTenantConfigured } = useActiveTenant();
  const prevTenantKey = useRef(tenantKey);

  const doSearch = useCallback(
    async (term: string) => {
      const config = getTenantConfig(tenantKey);

      if (!isTenantConfigured(config)) {
        setError(`Please configure ${config.name} credentials in preferences`);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchUsers(config, term);
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
    },
    [tenantKey],
  );

  useEffect(() => {
    if (prevTenantKey.current !== tenantKey) {
      setUsers([]);
      prevTenantKey.current = tenantKey;
    }

    const timer = setTimeout(() => {
      doSearch(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, doSearch, tenantKey]);

  const handleTenantChange = (newKey: string) => {
    switchTenant(newKey as TenantKey);
  };

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
        <List.Dropdown tooltip="Switch Tenant" value={tenantKey} onChange={handleTenantChange}>
          {ALL_TENANTS.map(({ key, label }) => {
            const config = getTenantConfig(key);
            return (
              <List.Dropdown.Item
                key={key}
                title={`${label} (${config.domain || "not configured"})`}
                value={key}
              />
            );
          })}
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
                target={<UserDetail user={user} domain={tenantConfig.domain} />}
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
                url={`https://${tenantConfig.domain}/dashboard/tenant/users/${encodeURIComponent(user.user_id)}`}
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
