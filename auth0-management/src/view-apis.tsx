import { List, ActionPanel, Action, showToast, Toast, Icon } from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCachedState } from "@raycast/utils";
import { listResourceServers } from "./utils/auth0-client";
import { isTenantConfigured } from "./utils/tenant-storage";
import { useActiveTenant } from "./utils/use-active-tenant";
import { ResourceServer } from "./utils/types";
import ApiDetail from "./components/ApiDetail";

/** Raycast command: browse Auth0 APIs (resource servers) with client-side filtering and tenant switching. */
export default function ViewApis() {
  const [searchText, setSearchText] = useState("");
  const [apis, setApis] = useCachedState<ResourceServer[]>("apis", []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantId, tenant, tenants, switchTenant, isLoading: tenantsLoading } = useActiveTenant();
  const prevTenantId = useRef(tenantId);

  const fetchApis = useCallback(async () => {
    if (!tenant) return;

    if (!isTenantConfigured(tenant)) {
      setError(`Please configure ${tenant.name} credentials`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await listResourceServers(tenant);
      setApis(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch APIs";
      setError(message);
      showToast({
        style: Toast.Style.Failure,
        title: "Fetch Failed",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    if (prevTenantId.current !== tenantId) {
      setApis([]);
      prevTenantId.current = tenantId;
    }

    if (!tenant) return;
    fetchApis();
  }, [fetchApis, tenantId, tenant]);

  const handleTenantChange = (newId: string) => {
    switchTenant(newId);
  };

  const filtered = apis.filter((api) => {
    if (!searchText) return true;
    const term = searchText.toLowerCase();
    return (api.name?.toLowerCase().includes(term) ?? false) || api.identifier.toLowerCase().includes(term);
  });

  if (error && !apis.length) {
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
          icon={Icon.Globe}
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
      searchBarPlaceholder="Filter APIs..."
      navigationTitle="View APIs"
      searchBarAccessory={
        <List.Dropdown tooltip="Switch Tenant" value={tenantId} onChange={handleTenantChange}>
          {tenants.map((t) => (
            <List.Dropdown.Item key={t.id} title={`${t.name + " " + t.environment || "not configured"}`} value={t.id} />
          ))}
        </List.Dropdown>
      }
    >
      {filtered.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.Globe}
          title="No APIs"
          description={searchText ? "No APIs match your filter" : "No APIs found for this tenant"}
        />
      )}
      {filtered.map((api) => (
        <List.Item
          key={api.id}
          icon={Icon.Globe}
          title={api.name ?? "Unnamed API"}
          subtitle={api.identifier}
          accessories={[...(api.scopes?.length ? [{ text: `${api.scopes.length} scopes` }] : [])]}
          actions={
            <ActionPanel>
              <Action.Push title="View Details" icon={Icon.Eye} target={<ApiDetail api={api} tenant={tenant!} />} />
              <Action.CopyToClipboard
                title="Copy Identifier"
                content={api.identifier}
                shortcut={{ modifiers: ["cmd"], key: "." }}
              />
              {tenant?.domain && (
                <Action.OpenInBrowser
                  title="Open in Auth0 Dashboard"
                  url={`https://${tenant.domain}/admin/apis/${api.id}/settings`}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
              )}
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={() => fetchApis()}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
