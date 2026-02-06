import { List, ActionPanel, Action, Icon, Color, openExtensionPreferences, popToRoot } from "@raycast/api";
import { getTenantConfig } from "./utils/preferences";
import { useActiveTenant } from "./utils/use-active-tenant";
import { TenantKey } from "./utils/types";

const TENANTS: { key: TenantKey; label: string; color: Color }[] = [
  { key: "dev", label: "Development", color: Color.Green },
  { key: "staging", label: "Staging", color: Color.Orange },
  { key: "prod", label: "Production", color: Color.Red },
];

export default function SwitchTenant() {
  const { tenantKey: activeKey, switchTenant, isTenantConfigured } = useActiveTenant();

  return (
    <List navigationTitle="Switch Tenant">
      {TENANTS.map(({ key, label, color }) => {
        const config = getTenantConfig(key);
        const isActive = key === activeKey;
        const isConfigured = isTenantConfigured(config);

        return (
          <List.Item
            key={key}
            icon={isActive ? { source: Icon.CheckCircle, tintColor: color } : { source: Icon.Circle, tintColor: color }}
            title={label}
            subtitle={config.domain || "Not configured"}
            accessories={[
              isActive ? { tag: { value: "Active", color } } : {},
              isConfigured
                ? { icon: { source: Icon.Check, tintColor: Color.Green }, tooltip: "Configured" }
                : { icon: { source: Icon.Xmark, tintColor: Color.SecondaryText }, tooltip: "Not configured" },
            ]}
            actions={
              <ActionPanel>
                {!isActive && isConfigured && (
                  <Action
                    title={`Switch to ${label}`}
                    icon={Icon.Switch}
                    onAction={() => {
                      switchTenant(key);
                      popToRoot();
                    }}
                  />
                )}
                <Action title="Open Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
                {config.domain && (
                  <Action.CopyToClipboard
                    title="Copy Domain"
                    content={config.domain}
                    shortcut={{ modifiers: ["cmd"], key: "." }}
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
