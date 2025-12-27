// src/types/wifi.ts

export interface WiFiNetwork {
  ssid: string;
  rssi: number;
  security: string;
  channel: string;
  bssid: string;
  isConnected: boolean;
}

export interface Preferences {
  wifiInterface: string;
}

export interface CachedData {
  version: number;
  networks: WiFiNetwork[];
  currentSSID: string;
  timestamp: number;
}
