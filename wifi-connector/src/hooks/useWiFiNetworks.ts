// src/hooks/useWiFiNetworks.ts
import { useState, useCallback } from "react";
import { showToast, Toast } from "@raycast/api";
import { WiFiNetwork } from "../types/wifi";
import { scanNetworksAndGetCurrent } from "../services/wifi-scanner";
import { getCachedNetworks, setCachedNetworks, clearNetworksCache } from "../utils/cache";

export function useWiFiNetworks() {
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSSID, setCurrentSSID] = useState<string>("");

  const loadNetworks = useCallback(async () => {
    try {
      // Try to load from cache first
      const cachedData = getCachedNetworks();
      if (cachedData) {
        setNetworks(cachedData.networks);
        setCurrentSSID(cachedData.currentSSID);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Get system_profiler output once and parse both current network and available networks
      const { currentNetwork, availableNetworks } = scanNetworksAndGetCurrent();

      setCurrentSSID(currentNetwork);
      setNetworks(availableNetworks);

      // Cache the results with version
      setCachedNetworks(availableNetworks, currentNetwork);
    } catch (error) {
      console.error("Error loading networks:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load networks",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    clearNetworksCache();
    await loadNetworks();
    await showToast({
      style: Toast.Style.Success,
      title: "Networks Refreshed",
    });
  }, [loadNetworks]);

  return {
    networks,
    isLoading,
    currentSSID,
    loadNetworks,
    forceRefresh,
  };
}
