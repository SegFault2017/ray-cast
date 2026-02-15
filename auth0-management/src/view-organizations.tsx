import { List, ActionPanel, Action, showToast, Toast, Icon } from "@raycast/api";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useCachedState } from "@raycast/utils";
import { listOrganizations, getAuth0ErrorMessage } from "./utils/auth0-client";
import { isTenantConfigured } from "./utils/tenant-storage";
import { useActiveTenant } from "./utils/use-active-tenant";
import { Organization } from "./utils/types";
import { parseTenantDomain } from "./utils/formatting";
import OrganizationDetail from "./components/OrganizationDetail";
import TenantDropdown from "./components/TenantDropdown";

/** Raycast command: browse Auth0 organizations with client-side filtering and tenant switching. */
export default function ViewOrganizations() {
  const { tenantId, tenant, tenants, switchTenant, isLoading: tenantsLoading } = useActiveTenant();
  const [searchText, setSearchText] = useState("");
  const [organizations, setOrganizations] = useCachedState<Organization[]>(`organizations-${tenantId}`, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevTenantId = useRef(tenantId);
  const { tenantSlug, region } = parseTenantDomain(tenant?.domain ?? "");

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
      const message = getAuth0ErrorMessage(err, "read:organizations");
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

  const filtered = useMemo(
    () =>
      organizations.filter((org) => {
        if (!searchText) return true;
        const term = searchText.toLowerCase();
        return org.name.toLowerCase().includes(term) || (org.display_name?.toLowerCase().includes(term) ?? false);
      }),
    [organizations, searchText],
  );

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
      searchBarAccessory={<TenantDropdown tenantId={tenantId} tenants={tenants} onTenantChange={switchTenant} />}
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
                  url={`https://manage.auth0.com/dashboard/${region}/${tenantSlug}/organizations/${org.id}/overview`}
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
