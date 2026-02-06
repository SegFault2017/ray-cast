import { getPreferenceValues, LocalStorage, Color } from "@raycast/api";
import { LegacyPreferences } from "./types";
import { getTenants, saveTenants } from "./tenant-storage";

const MIGRATED_KEY = "tenants_migrated";

const LEGACY_TENANTS = [
  { key: "dev", name: "Development", color: Color.Green },
  { key: "staging", name: "Staging", color: Color.Orange },
  { key: "prod", name: "Production", color: Color.Red },
] as const;

export async function migrateTenants(): Promise<void> {
  const migrated = await LocalStorage.getItem<string>(MIGRATED_KEY);
  if (migrated) return;

  let prefs: LegacyPreferences;
  try {
    prefs = getPreferenceValues<LegacyPreferences>();
  } catch {
    await LocalStorage.setItem(MIGRATED_KEY, "true");
    return;
  }

  const existing = await getTenants();
  if (existing.length > 0) {
    await LocalStorage.setItem(MIGRATED_KEY, "true");
    return;
  }

  const prefMap: Record<string, { domain: string; clientId: string; clientSecret: string }> = {
    dev: { domain: prefs.devDomain, clientId: prefs.devClientId, clientSecret: prefs.devClientSecret },
    staging: {
      domain: prefs.stagingDomain,
      clientId: prefs.stagingClientId,
      clientSecret: prefs.stagingClientSecret,
    },
    prod: { domain: prefs.prodDomain, clientId: prefs.prodClientId, clientSecret: prefs.prodClientSecret },
  };

  const tenants = LEGACY_TENANTS.filter(({ key }) => {
    const cfg = prefMap[key];
    return cfg.domain && cfg.clientId && cfg.clientSecret;
  }).map(({ key, name, color }) => ({
    id: key,
    name,
    color,
    ...prefMap[key],
  }));

  if (tenants.length > 0) {
    await saveTenants(tenants);
  }

  await LocalStorage.setItem(MIGRATED_KEY, "true");
}
