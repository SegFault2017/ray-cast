import { List, ActionPanel, Action, Icon, Color, showToast, Toast } from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { getLogs, getAuth0ErrorMessage } from "../utils/auth0-client";
import { LogEntry, Tenant, User } from "../utils/types";
import LogDetail from "./LogDetail";

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

function getLogTypeInfo(type?: string) {
  if (!type) return { label: "Unknown", icon: Icon.QuestionMark, color: Color.SecondaryText };
  return LOG_TYPE_MAP[type] || { label: type, icon: Icon.Dot, color: Color.SecondaryText };
}

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

interface UserLogsDetailProps {
  user: User;
  tenant: Tenant;
}

/** List view showing Auth0 logs filtered to a specific user. */
export default function UserLogsDetail({ user, tenant }: UserLogsDetailProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await getLogs(tenant, { search: `user_id:"${user.user_id}"` });
      setLogs(results);
    } catch (err) {
      const message = getAuth0ErrorMessage(err, "read:logs");
      showToast({ style: Toast.Style.Failure, title: "Fetch Failed", message });
    } finally {
      setIsLoading(false);
    }
  }, [tenant, user.user_id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <List isLoading={isLoading} navigationTitle={`Logs: ${user.email}`}>
      {logs.length === 0 && !isLoading && (
        <List.EmptyView icon={Icon.List} title="No Logs" description="No recent logs found for this user" />
      )}
      {logs.map((log, index) => {
        const typeInfo = getLogTypeInfo(log.type);
        return (
          <List.Item
            key={log.log_id || `log-${index}`}
            icon={{ source: typeInfo.icon, tintColor: typeInfo.color }}
            title={log.description || typeInfo.label}
            subtitle={log.client_name || ""}
            accessories={[log.ip ? { text: log.ip } : {}, { text: formatRelativeDate(log.date), tooltip: log.date }]}
            actions={
              <ActionPanel>
                <Action.Push title="View Details" icon={Icon.Eye} target={<LogDetail log={log} tenant={tenant} />} />
                {log.log_id && (
                  <Action.CopyToClipboard
                    title="Copy Log ID"
                    content={log.log_id}
                    shortcut={{ modifiers: ["cmd"], key: "." }}
                  />
                )}
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={fetchLogs}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
