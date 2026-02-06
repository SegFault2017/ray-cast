import { getPreferenceValues } from "@raycast/api";
import { Preferences, TenantConfig, TenantKey } from "./types";

const TENANT_LABELS: Record<TenantKey, string> = {
  dev: "Development",
  staging: "Staging",
  prod: "Production",
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

export function validateActiveTenant(): { isValid: boolean; error?: string } {
  const tenantKey = getActiveTenantKey();
  const config = getActiveTenantConfig();

  if (!config.domain) {
    return { isValid: false, error: `Please configure ${TENANT_LABELS[tenantKey]} domain in preferences` };
  }
  if (!config.clientId) {
    return { isValid: false, error: `Please configure ${TENANT_LABELS[tenantKey]} Client ID in preferences` };
  }
  if (!config.clientSecret) {
    return { isValid: false, error: `Please configure ${TENANT_LABELS[tenantKey]} Client Secret in preferences` };
  }

  return { isValid: true };
}

