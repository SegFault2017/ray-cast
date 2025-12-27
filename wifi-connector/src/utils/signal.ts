// src/utils/signal.ts

export function getSignalIcon(rssi: number): string {
  if (rssi >= -50) return "▂▄▆█";
  if (rssi >= -60) return "▂▄▆";
  if (rssi >= -70) return "▂▄";
  return "▂";
}
