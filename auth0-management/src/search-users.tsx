import { List, ActionPanel, Action, showToast, Toast, Icon, Color, Image } from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCachedState } from "@raycast/utils";
import { searchUsers } from "./utils/auth0-client";
import { isTenantConfigured } from "./utils/tenant-storage";
import { useActiveTenant } from "./utils/use-active-tenant";
import { User } from "./utils/types";
import UserDetail from "./components/UserDetail";

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
  const { tenantId, tenant, tenants, switchTenant, isLoading: tenantsLoading } = useActiveTenant();
  const prevTenantId = useRef(tenantId);

  const doSearch = useCallback(
    async (term: string) => {
      if (!tenant) return;

      if (!isTenantConfigured(tenant)) {
        setError(`Please configure ${tenant.name} credentials`);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await searchUsers(tenant, term);
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
    [tenant],
  );

  useEffect(() => {
    if (prevTenantId.current !== tenantId) {
      setUsers([]);
      prevTenantId.current = tenantId;
    }

    if (!tenant) return;

    const timer = setTimeout(() => {
      doSearch(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, doSearch, tenantId, tenant]);

  const handleTenantChange = (newId: string) => {
    switchTenant(newId);
  };

  if (error && !users.length) {
    return (
      <List>
        <List.EmptyView icon={Icon.ExclamationMark} title="Configuration Required" description={error} />
      </List>
    );
  }

  if (!tenantsLoading && tenants.length === 0) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Building}
          title="No Tenants Configured"
          description="Use the Switch Tenant command to add a tenant first"
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading || tenantsLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search by name, email, or user ID..."
      navigationTitle="Search Users"
      searchBarAccessory={
        <List.Dropdown tooltip="Switch Tenant" value={tenantId} onChange={handleTenantChange}>
          {tenants.map((t) => (
            <List.Dropdown.Item key={t.id} title={`${t.name + " " + t.environment || "not configured"}`} value={t.id} />
          ))}
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
            tenant
              ? { tag: { value: tenant.environment, color: tenant.color } }
              : {},
            { text: `Logins: ${user.logins_count ?? 0}` },
            { text: formatDate(user.last_login), tooltip: "Last login" },
            user.blocked ? { icon: { source: Icon.Lock, tintColor: Color.Red }, tooltip: "Blocked" } : {},
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Details"
                icon={Icon.Eye}
                target={<UserDetail user={user} domain={tenant?.domain ?? ""} />}
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
              {tenant?.domain && (
                <Action.OpenInBrowser
                  title="Open in Auth0 Dashboard"
                  url={`https://${tenant.domain}/dashboard/tenant/users/${encodeURIComponent(user.user_id)}`}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
              )}
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
