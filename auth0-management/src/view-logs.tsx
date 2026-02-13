import { List, ActionPanel, Action, showToast, Toast, Icon, Color, Form, useNavigation } from "@raycast/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCachedState } from "@raycast/utils";
import { getLogs, getAuth0ErrorMessage } from "./utils/auth0-client";
import { isTenantConfigured } from "./utils/tenant-storage";
import { useActiveTenant } from "./utils/use-active-tenant";
import { LogEntry } from "./utils/types";
import LogDetail from "./components/LogDetail";
import TenantDropdown from "./components/TenantDropdown";

const LOG_TYPE_MAP: Record<string, { label: string; icon: Icon; color: Color }> = {
  s: { label: "Success Login", icon: Icon.CheckCircle, color: Color.Green },
  ss: { label: "Success Signup", icon: Icon.AddPerson, color: Color.Green },
  f: { label: "Failed Login", icon: Icon.XMarkCircle, color: Color.Red },
  fp: { label: "Failed Login (Wrong Password)", icon: Icon.XMarkCircle, color: Color.Red },
  fs: { label: "Failed Signup", icon: Icon.XMarkCircle, color: Color.Red },
  fu: { label: "Failed Login (Invalid Email)", icon: Icon.XMarkCircle, color: Color.Red },
  fc: { label: "Failed by Connector", icon: Icon.XMarkCircle, color: Color.Red },
  fco: { label: "Failed by CORS", icon: Icon.XMarkCircle, color: Color.Red },
  seacft: { label: "Success Exchange (Auth Code)", icon: Icon.CheckCircle, color: Color.Green },
  feacft: { label: "Failed Exchange (Auth Code)", icon: Icon.XMarkCircle, color: Color.Red },
  seccft: { label: "Success Exchange (Client Credentials)", icon: Icon.CheckCircle, color: Color.Green },
  feccft: { label: "Failed Exchange (Client Credentials)", icon: Icon.XMarkCircle, color: Color.Red },
  du: { label: "Deleted User", icon: Icon.Trash, color: Color.Orange },
  sv: { label: "Success Verification Email", icon: Icon.Envelope, color: Color.Green },
  fv: { label: "Failed Verification Email", icon: Icon.Envelope, color: Color.Red },
  scp: { label: "Success Change Password", icon: Icon.Key, color: Color.Green },
  fcp: { label: "Failed Change Password", icon: Icon.Key, color: Color.Red },
  sce: { label: "Success Change Email", icon: Icon.Envelope, color: Color.Green },
  fce: { label: "Failed Change Email", icon: Icon.Envelope, color: Color.Red },
  sapi: { label: "Success API Operation", icon: Icon.Globe, color: Color.Green },
  fapi: { label: "Failed API Operation", icon: Icon.Globe, color: Color.Red },
  limit_wc: { label: "Blocked Account", icon: Icon.Lock, color: Color.Red },
  limit_ui: { label: "Too Many Logins", icon: Icon.Lock, color: Color.Orange },
  gd_otp_rate_limit_exceed: { label: "OTP Rate Limit", icon: Icon.Lock, color: Color.Orange },
};

/** Map a log event type code to its display label, icon, and color. Falls back to a generic style. */
function getLogTypeInfo(type?: string) {
  if (!type) return { label: "Unknown", icon: Icon.QuestionMark, color: Color.SecondaryText };
  return LOG_TYPE_MAP[type] || { label: type, icon: Icon.Dot, color: Color.SecondaryText };
}

/** Format an ISO date string as a human-readable relative time (e.g. "5m ago", "2d ago"). */
function formatRelativeDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Build a concise label for the active date filter to display in the navigation title.
 * Returns undefined when no filter is active. Detects presets, exact-date, and custom ranges.
 */
function formatFilterLabel(dateFrom: Date | null, dateTo: Date | null): string | undefined {
  if (!dateFrom && !dateTo) return undefined;

  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  if (dateFrom && !dateTo) {
    const now = Date.now();
    const diffMs = now - dateFrom.getTime();
    const diffHours = diffMs / 3_600_000;
    // Round to a friendly label when close to a whole unit
    if (diffHours < 1.5) {
      const mins = Math.round(diffMs / 60_000);
      return mins <= 60 ? "Last Hour" : `Last ${mins}m`;
    }
    if (diffHours < 48) {
      const h = Math.round(diffHours);
      return h === 24 ? "Last 24h" : `Last ${h}h`;
    }
    const diffDays = Math.round(diffHours / 24);
    if (diffDays <= 31) return diffDays === 7 ? "Last 7 Days" : diffDays === 30 ? "Last 30 Days" : `Last ${diffDays}d`;
    return `From ${fmt(dateFrom)}`;
  }
  if (!dateFrom && dateTo) return `Until ${fmt(dateTo)}`;

  // Check if it's an exact-date filter (start and end of the same day)
  if (
    dateFrom &&
    dateTo &&
    dateFrom.getHours() === 0 &&
    dateFrom.getMinutes() === 0 &&
    dateTo.getHours() === 23 &&
    dateTo.getMinutes() === 59 &&
    dateFrom.toDateString() === dateTo.toDateString()
  ) {
    return dateFrom.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return `${fmt(dateFrom!)} \u2013 ${fmt(dateTo!)}`;
}

/** Form component that lets the user enter a custom numerical time range (e.g. "12 hours ago"). */
function CustomTimeRangeForm({ onApply }: { onApply: (from: Date) => void }) {
  const { pop } = useNavigation();
  const [valueError, setValueError] = useState<string | undefined>();

  function handleSubmit(values: { value: string; unit: string }) {
    const num = parseInt(values.value, 10);
    if (isNaN(num) || num <= 0) {
      setValueError("Enter a positive number");
      return;
    }
    const from = new Date();
    switch (values.unit) {
      case "hours":
        from.setHours(from.getHours() - num);
        break;
      case "days":
        from.setDate(from.getDate() - num);
        break;
      case "weeks":
        from.setDate(from.getDate() - num * 7);
        break;
      case "months":
        from.setMonth(from.getMonth() - num);
        break;
    }
    onApply(from);
    pop();
  }

  return (
    <Form
      navigationTitle="Custom Time Range"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Apply Filter" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="value"
        title="Value"
        placeholder="e.g. 12"
        error={valueError}
        onChange={() => setValueError(undefined)}
      />
      <Form.Dropdown id="unit" title="Unit" defaultValue="hours">
        <Form.Dropdown.Item value="hours" title="Hours" />
        <Form.Dropdown.Item value="days" title="Days" />
        <Form.Dropdown.Item value="weeks" title="Weeks" />
        <Form.Dropdown.Item value="months" title="Months" />
      </Form.Dropdown>
    </Form>
  );
}

/** Raycast command: browse Auth0 tenant logs with text search, date range filters, and time presets. */
export default function ViewLogs() {
  const { tenantId, tenant, tenants, switchTenant, isLoading: tenantsLoading } = useActiveTenant();
  const [searchText, setSearchText] = useState("");
  const [logs, setLogs] = useCachedState<LogEntry[]>(`logs-${tenantId}`, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const prevTenantId = useRef(tenantId);

  const hasDateFilter = dateFrom !== null || dateTo !== null;
  const filterLabel = formatFilterLabel(dateFrom, dateTo);
  const navigationTitle = filterLabel ? `View Logs \u2014 ${filterLabel}` : "View Logs";
  const domain = tenant?.domain;
  const domainParts = domain?.split(".") ?? [];
  const tenantSlug = domainParts[0];
  const region = domainParts.length >= 4 ? domainParts[1] : "us";

  function applyPreset(preset: "1h" | "24h" | "7d" | "30d") {
    const now = new Date();
    const from = new Date(now);
    switch (preset) {
      case "1h":
        from.setHours(from.getHours() - 1);
        break;
      case "24h":
        from.setDate(from.getDate() - 1);
        break;
      case "7d":
        from.setDate(from.getDate() - 7);
        break;
      case "30d":
        from.setDate(from.getDate() - 30);
        break;
    }
    setDateFrom(from);
    setDateTo(null);
  }

  const fetchLogs = useCallback(
    async (search: string, fromDate: Date | null, toDate: Date | null) => {
      if (!tenant) return;

      if (!isTenantConfigured(tenant)) {
        setError(`Please configure ${tenant.name} credentials`);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const results = await getLogs(tenant, {
          search: search || undefined,
          dateFrom: fromDate ?? undefined,
          dateTo: toDate ?? undefined,
        });
        setLogs(results);
      } catch (err) {
        const message = getAuth0ErrorMessage(err, "read:logs");
        setError(message);
        showToast({ style: Toast.Style.Failure, title: "Fetch Failed", message });
      } finally {
        setIsLoading(false);
      }
    },
    [tenant],
  );

  useEffect(() => {
    if (prevTenantId.current !== tenantId) {
      setLogs([]);
      prevTenantId.current = tenantId;
    }

    if (!tenant) return;

    const timer = setTimeout(() => {
      fetchLogs(searchText, dateFrom, dateTo);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, fetchLogs, tenantId, tenant, dateFrom, dateTo]);

  if (error && !logs.length) {
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
      searchBarPlaceholder="Search logs by user, client, or description..."
      navigationTitle={navigationTitle}
      searchBarAccessory={<TenantDropdown tenantId={tenantId} tenants={tenants} onTenantChange={switchTenant} />}
    >
      {logs.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.List}
          title="No Logs"
          description={searchText ? "No logs match your search" : "No recent logs found"}
        />
      )}
      {logs.map((log, index) => {
        const typeInfo = getLogTypeInfo(log.type);
        return (
          <List.Item
            key={log.log_id || `log-${index}`}
            icon={{ source: typeInfo.icon, tintColor: typeInfo.color }}
            title={log.user_name || log.description || typeInfo.label}
            subtitle={log.client_name || ""}
            accessories={[
              tenant ? { tag: { value: tenant.environment, color: tenant.color } } : {},
              log.ip ? { text: log.ip } : {},
              { text: formatRelativeDate(log.date), tooltip: log.date },
            ]}
            actions={
              <ActionPanel>
                <Action.Push title="View Details" icon={Icon.Eye} target={<LogDetail log={log} tenant={tenant!} />} />
                {log.log_id && (
                  <Action.CopyToClipboard
                    title="Copy Log ID"
                    content={log.log_id}
                    shortcut={{ modifiers: ["cmd"], key: "." }}
                  />
                )}
                {tenant?.domain && (
                  <Action.OpenInBrowser
                    title="Open in Auth0 Dashboard"
                    url={`https://manage.auth0.com/dashboard/${region}/${tenantSlug}/logs/${log.log_id}/`}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                  />
                )}
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={() => fetchLogs(searchText, dateFrom, dateTo)}
                />
                <Action.PickDate
                  title="Filter Exact Date"
                  shortcut={{ modifiers: ["cmd"], key: "d" }}
                  type={Action.PickDate.Type.Date}
                  onChange={(date) => {
                    if (date) {
                      const start = new Date(date);
                      start.setHours(0, 0, 0, 0);
                      const end = new Date(date);
                      end.setHours(23, 59, 59, 999);
                      setDateFrom(start);
                      setDateTo(end);
                    }
                  }}
                />
                <Action.PickDate
                  title="Filter from Date"
                  shortcut={{ modifiers: ["cmd", "shift"], key: "d" }}
                  type={Action.PickDate.Type.DateTime}
                  onChange={(date) => setDateFrom(date)}
                />
                <Action.PickDate
                  title="Filter to Date"
                  shortcut={{ modifiers: ["opt", "shift"], key: "d" }}
                  type={Action.PickDate.Type.DateTime}
                  onChange={(date) => setDateTo(date)}
                />
                <ActionPanel.Submenu title="Time Presets" icon={Icon.Clock} shortcut={{ modifiers: ["cmd"], key: "t" }}>
                  <Action title="Last Hour" onAction={() => applyPreset("1h")} />
                  <Action title="Last 24 Hours" onAction={() => applyPreset("24h")} />
                  <Action title="Last 7 Days" onAction={() => applyPreset("7d")} />
                  <Action title="Last 30 Days" onAction={() => applyPreset("30d")} />
                  <Action.Push
                    title="Custom Range\u2026"
                    icon={Icon.Pencil}
                    target={
                      <CustomTimeRangeForm
                        onApply={(from) => {
                          setDateFrom(from);
                          setDateTo(null);
                        }}
                      />
                    }
                  />
                </ActionPanel.Submenu>
                {hasDateFilter && (
                  <Action
                    title="Clear Date Filter"
                    icon={Icon.XMarkCircle}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "x" }}
                    onAction={() => {
                      setDateFrom(null);
                      setDateTo(null);
                    }}
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
