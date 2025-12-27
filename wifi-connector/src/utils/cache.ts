// src/utils/cache.ts
import { Cache } from "@raycast/api";
import { WiFiNetwork, CachedData } from "../types/wifi";

const cache = new Cache();
const CACHE_KEY = "wifi-networks";
export const CACHE_VERSION = 3; // Increment this to invalidate old cache
export const CACHE_DURATION = 5000; // 5 seconds

export function getCachedNetworks(): CachedData | null {
  const cachedData = cache.get(CACHE_KEY);
  if (!cachedData) {
    return null;
  }

  try {
    const parsed: CachedData = JSON.parse(cachedData);
    const cacheAge = Date.now() - parsed.timestamp;

    // Check cache version and age
    if (parsed.version === CACHE_VERSION && cacheAge < CACHE_DURATION) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error("Failed to parse cached data:", error);
    return null;
  }
}

export function setCachedNetworks(networks: WiFiNetwork[], currentSSID: string): void {
  const data: CachedData = {
    version: CACHE_VERSION,
    networks,
    currentSSID,
    timestamp: Date.now(),
  };

  cache.set(CACHE_KEY, JSON.stringify(data));
}

export function clearNetworksCache(): void {
  cache.remove(CACHE_KEY);
}
