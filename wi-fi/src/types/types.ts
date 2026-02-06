export interface WifiInfo {
  key: string;
  value: string;
}

export interface WiFiNetwork {
  ssid: string;
  rssi: number;
  security: string;
  channel: string;
  bssid: string;
  isConnected: boolean;
}

export interface CachedData {
  version: number;
  networks: WiFiNetwork[];
  currentSSID: string;
  timestamp: number;
}
