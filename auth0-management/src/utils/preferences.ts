import { getPreferenceValues } from "@raycast/api";
import { Preferences, TenantConfig, TenantKey } from "./types";

const TENANT_LABELS: Record<TenantKey, string> = {
  dev: "Dev",
  staging: "Staging",
  prod: "Prod",
};

export function getPreferences(): Preferences {
  return getPreferenceValues<Preferences>();
}

export function getActiveTenantKey(): TenantKey {
  return getPreferences().activeTenant;
}

export function getTenantConfig(tenantKey: TenantKey): TenantConfig {
  const prefs = getPreferences();

  const configMap: Record<TenantKey, TenantConfig> = {
    dev: {
      name: TENANT_LABELS.dev,
      domain: prefs.devDomain,
      clientId: prefs.devClientId,
      clientSecret: prefs.devClientSecret,
    },
    staging: {
      name: TENANT_LABELS.staging,
      domain: prefs.stagingDomain,
      clientId: prefs.stagingClientId,
      clientSecret: prefs.stagingClientSecret,
    },
    prod: {
      name: TENANT_LABELS.prod,
      domain: prefs.prodDomain,
      clientId: prefs.prodClientId,
      clientSecret: prefs.prodClientSecret,
    },
  };

  return configMap[tenantKey];
}

export function getActiveTenantConfig(): TenantConfig {
  return getTenantConfig(getActiveTenantKey());
}


