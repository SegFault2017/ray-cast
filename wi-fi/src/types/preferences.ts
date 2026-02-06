import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  showWifiName: boolean;
  showIpAddress: boolean;
  wifiInterface: string;
}

export const { showWifiName, showIpAddress } = getPreferenceValues<Preferences>();
