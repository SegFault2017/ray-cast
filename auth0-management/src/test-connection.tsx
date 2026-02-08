import { List, ActionPanel, Action, showToast, Toast, Icon, Color } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { testConnection, getAuth0ErrorMessage } from "./utils/auth0-client";
import { getTenants, isTenantConfigured } from "./utils/tenant-storage";
import { Tenant } from "./utils/types";

interface TenantTestResult {
  status: "loading" | "success" | "error";
  friendlyName?: string;
  error?: string;
  responseTimeMs?: number;
}

export default function TestConnection() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [results, setResults] = useState<Map<string, TenantTestResult>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const runTests = useCallback(async (tenantsToTest: Tenant[]) => {
    // Initialize all as loading
    const initial = new Map<string, TenantTestResult>();
    for (const t of tenantsToTest) {
      initial.set(t.id, { status: "loading" });
    }
    setResults(new Map(initial));

    // Test each tenant sequentially to avoid token race conditions
    for (const t of tenantsToTest) {
      if (!isTenantConfigured(t)) {
        initial.set(t.id, { status: "error", error: "Not configured" });
        setResults(new Map(initial));
        continue;
      }

      const start = Date.now();
      try {
        const result = await testConnection(t);
        const elapsed = Date.now() - start;
        initial.set(t.id, {
          status: "success",
          friendlyName: result.friendly_name,
          responseTimeMs: elapsed,
        });
      } catch (err) {
        const elapsed = Date.now() - start;
        const message = getAuth0ErrorMessage(err, "read:tenant_settings");
        initial.set(t.id, { status: "error", error: message, responseTimeMs: elapsed });
      }
      setResults(new Map(initial));
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const loaded = await getTenants();
      setTenants(loaded);
      if (loaded.length === 0) {
        setIsLoading(false);
        return;
      }
      await runTests(loaded);
    })();
  }, [runTests]);

  const handleRetestAll = async () => {
    setIsLoading(true);
    const loaded = await getTenants();
    setTenants(loaded);
    await runTests(loaded);
  };

  const handleRetestOne = async (tenant: Tenant) => {
    if (!isTenantConfigured(tenant)) {
      showToast({ style: Toast.Style.Failure, title: "Not Configured", message: `${tenant.name} is not configured` });
      return;
    }

    setResults((prev) => {
      const next = new Map(prev);
      next.set(tenant.id, { status: "loading" });
      return next;
    });

    const start = Date.now();
    try {
      const result = await testConnection(tenant);
      const elapsed = Date.now() - start;
      setResults((prev) => {
        const next = new Map(prev);
        next.set(tenant.id, { status: "success", friendlyName: result.friendly_name, responseTimeMs: elapsed });
        return next;
      });
      showToast({ style: Toast.Style.Success, title: "Connection OK", message: tenant.name });
    } catch (err) {
      const elapsed = Date.now() - start;
      const message = getAuth0ErrorMessage(err, "read:tenant_settings");
      setResults((prev) => {
        const next = new Map(prev);
        next.set(tenant.id, { status: "error", error: message, responseTimeMs: elapsed });
        return next;
      });
      showToast({ style: Toast.Style.Failure, title: "Connection Failed", message });
    }
  };

  if (!isLoading && tenants.length === 0) {
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
    <List isLoading={isLoading} navigationTitle="Test Tenant Connection">
      {tenants.map((tenant) => {
        const result = results.get(tenant.id);
        let icon: { source: Icon; tintColor?: Color };
        let subtitle: string;

        if (!result || result.status === "loading") {
          icon = { source: Icon.Clock, tintColor: Color.SecondaryText };
          subtitle = "Testing...";
        } else if (result.status === "success") {
          icon = { source: Icon.CheckCircle, tintColor: Color.Green };
          subtitle = tenant.domain;
        } else {
          icon = { source: Icon.XMarkCircle, tintColor: Color.Red };
          subtitle = result.error || "Failed";
        }

        const accessories: List.Item.Accessory[] = [{ tag: { value: tenant.environment, color: tenant.color } }];
        if (result?.responseTimeMs !== undefined) {
          accessories.push({ text: `${result.responseTimeMs}ms` });
        }
        if (result?.friendlyName) {
          accessories.push({ text: result.friendlyName, tooltip: "Tenant friendly name" });
        }

        return (
          <List.Item
            key={tenant.id}
            icon={icon}
            title={tenant.name}
            subtitle={subtitle}
            accessories={accessories}
            actions={
              <ActionPanel>
                <Action title="Re-Test" icon={Icon.ArrowClockwise} onAction={() => handleRetestOne(tenant)} />
                <Action
                  title="Re-Test All"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={handleRetestAll}
                />
                {tenant.domain && (
                  <Action.CopyToClipboard
                    title="Copy Domain"
                    content={tenant.domain}
                    shortcut={{ modifiers: ["cmd"], key: "." }}
                  />
                )}
                {tenant.domain && (
                  <Action.OpenInBrowser
                    title="Open in Auth0 Dashboard"
                    url={`https://${tenant.domain}/admin`}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                  />
                )}
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
