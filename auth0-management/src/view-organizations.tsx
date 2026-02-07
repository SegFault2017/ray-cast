import { List, ActionPanel, Action, showToast, Toast, Icon } from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCachedState } from "@raycast/utils";
import { listOrganizations } from "./utils/auth0-client";
import { isTenantConfigured } from "./utils/tenant-storage";
import { useActiveTenant } from "./utils/use-active-tenant";
import { Organization } from "./utils/types";
import OrganizationDetail from "./components/OrganizationDetail";

export default function ViewOrganizations() {
  const [searchText, setSearchText] = useState("");
  const [organizations, setOrganizations] = useCachedState<Organization[]>("organizations", []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tenantId, tenant, tenants, switchTenant, isLoading: tenantsLoading } = useActiveTenant();
  const prevTenantId = useRef(tenantId);

  const fetchOrganizations = useCallback(async () => {
    if (!tenant) return;

    if (!isTenantConfigured(tenant)) {
      setError(`Please configure ${tenant.name} credentials`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await listOrganizations(tenant);
      setOrganizations(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch organizations";
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
      setOrganizations([]);
      prevTenantId.current = tenantId;
    }

    if (!tenant) return;
    fetchOrganizations();
  }, [fetchOrganizations, tenantId, tenant]);

  const handleTenantChange = (newId: string) => {
    switchTenant(newId);
  };

  const filtered = organizations.filter((org) => {
    if (!searchText) return true;
    const term = searchText.toLowerCase();
    return org.name.toLowerCase().includes(term) || (org.display_name?.toLowerCase().includes(term) ?? false);
  });

  if (error && !organizations.length) {
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
      searchBarPlaceholder="Filter organizations..."
      navigationTitle="View Organizations"
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
          icon={Icon.Building}
          title="No Organizations"
          description={searchText ? "No organizations match your filter" : "No organizations found for this tenant"}
        />
      )}
      {filtered.map((org) => (
        <List.Item
          key={org.id}
          icon={org.branding?.logo_url ? { source: org.branding.logo_url } : Icon.Building}
          title={org.display_name || org.name}
          subtitle={org.name}
          accessories={[tenant ? { tag: { value: tenant.environment, color: tenant.color } } : {}]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Details"
                icon={Icon.Eye}
                target={<OrganizationDetail organization={org} tenant={tenant!} />}
              />
              <Action.CopyToClipboard
                title="Copy Org ID"
                content={org.id}
                shortcut={{ modifiers: ["cmd"], key: "." }}
              />
              <Action.CopyToClipboard
                title="Copy Org Name"
                content={org.name}
                shortcut={{ modifiers: ["cmd", "shift"], key: "." }}
              />
              {tenant?.domain && (
                <Action.OpenInBrowser
                  title="Open in Auth0 Dashboard"
                  url={`https://${tenant.domain}/admin/organizations/${org.id}/overview`}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
              )}
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={() => fetchOrganizations()}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
