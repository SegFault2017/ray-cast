import { showToast, Toast } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { getActiveTenantKey, getTenantConfig } from "./preferences";
import { TenantConfig, TenantKey } from "./types";

const TENANT_LABELS: Record<TenantKey, string> = {
  dev: "Development",
  staging: "Staging",
  prod: "Production",
};

function isTenantConfigured(config: TenantConfig): boolean {
  return Boolean(config.domain && config.clientId && config.clientSecret);
}

export function useActiveTenant() {
  const [tenantKey, setTenantKey] = useCachedState<TenantKey>("activeTenantKey", getActiveTenantKey());
  const tenantConfig = getTenantConfig(tenantKey);

  const switchTenant = (key: TenantKey) => {
    const config = getTenantConfig(key);

    if (!isTenantConfigured(config)) {
      showToast({
        style: Toast.Style.Failure,
        title: "Tenant Not Configured",
        message: `Please configure ${TENANT_LABELS[key]} credentials in preferences`,
      });
      return;
    }

    setTenantKey(key);
    showToast({
      style: Toast.Style.Success,
      title: "Tenant Switched",
      message: `Now using ${TENANT_LABELS[key]} (${config.domain})`,
    });
  };

  return { tenantKey, tenantConfig, switchTenant, isTenantConfigured } as const;
}
