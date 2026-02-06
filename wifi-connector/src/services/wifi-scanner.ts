// src/services/wifi-scanner.ts
import { execSync } from "child_process";
import { WiFiNetwork } from "../types/wifi";

export function scanNetworksAndGetCurrent(): { currentNetwork: string; availableNetworks: WiFiNetwork[] } {
  try {
    const output = execSync(`/usr/sbin/system_profiler SPAirPortDataType`, {
      encoding: "utf-8",
      timeout: 15000,
      maxBuffer: 20 * 1024 * 1024,
    });

    const networks: WiFiNetwork[] = [];
    const lines = output.split("\n");
    let currentNetwork = "";

    // First pass: Extract current network
    let foundCurrentNetwork = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("Current Network Information:")) {
        foundCurrentNetwork = true;
        continue;
      }

      if (foundCurrentNetwork && lines[i].trim().match(/^[A-Za-z0-9\-_]/)) {
        // This is the SSID line (first line after "Current Network Information:")
        currentNetwork = lines[i].trim().replace(/:$/, "");
        break;
      }

      // If we found the section but hit another section, we're not connected
      if (foundCurrentNetwork && lines[i].includes(":") && !lines[i].startsWith("        ")) {
        break;
      }
    }

    // Second pass: Parse available networks
    let inNetworkSection = false;
    let currentEntry: Partial<WiFiNetwork> = {};
    let networkIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for both "Local Wi-Fi Networks:" (when disconnected) and "Other Local Wi-Fi Networks:" (when connected)
      if (trimmed.includes("Local Wi-Fi Networks:")) {
        inNetworkSection = true;
        continue;
      }

      if (!inNetworkSection) continue;

      // Check if we've hit another major section (no indentation and contains colon)
      if (line.length > 0 && line[0] !== " " && line.includes(":")) {
        break;
      }

      if (trimmed === "") continue;

      // Calculate current line's indentation
      const currentIndent = line.search(/\S/);

      // Detect network name vs property by checking if line has ": " with text after
      const hasPropertyFormat = trimmed.includes(": ") && trimmed.split(": ").length === 2;

      if (!hasPropertyFormat && trimmed.length > 0) {
        // This is likely a network name

        // Set the network indent level on first network
        if (networkIndent === 0) {
          networkIndent = currentIndent;
        }

        // Only treat as network name if at the correct indent level
        if (currentIndent === networkIndent) {
          // Save previous entry if it has required fields
          if (currentEntry.ssid && currentEntry.channel) {
            networks.push({
              ssid: currentEntry.ssid,
              rssi: currentEntry.rssi || -70,
              security: currentEntry.security || "Unknown",
              channel: currentEntry.channel,
              bssid: currentEntry.bssid || `${currentEntry.ssid}-${currentEntry.channel}`, // Use SSID+Channel as fallback ID
              isConnected: currentEntry.ssid === currentNetwork,
            });
          }

          // Start new entry
          currentEntry = { ssid: trimmed.replace(/:$/, "") };
        }
      }
      // This is a property line
      else if (hasPropertyFormat && currentEntry.ssid) {
        if (trimmed.startsWith("Security:")) {
          currentEntry.security = trimmed.split(": ")[1]?.trim() || "Unknown";
        } else if (trimmed.startsWith("Channel:")) {
          const channelPart = trimmed.split(": ")[1]?.trim() || "";
          currentEntry.channel = channelPart.split(/\s+/)[0];
        } else if (trimmed.includes("Signal / Noise:")) {
          const signalMatch = trimmed.match(/-?\d+/);
          currentEntry.rssi = signalMatch ? parseInt(signalMatch[0]) : -70;
        } else if (trimmed.startsWith("BSSID:") || trimmed.startsWith("MAC Address:")) {
          currentEntry.bssid = trimmed.split(": ")[1]?.trim() || "";
        }
      }
    }

    // Add last entry if valid
    if (currentEntry.ssid && currentEntry.channel) {
      networks.push({
        ssid: currentEntry.ssid,
        rssi: currentEntry.rssi || -70,
        security: currentEntry.security || "Unknown",
        channel: currentEntry.channel,
        bssid: currentEntry.bssid || `${currentEntry.ssid}-${currentEntry.channel}`,
        isConnected: currentEntry.ssid === currentNetwork,
      });
    }

    // Remove duplicates based on SSID + Channel combination
    const uniqueNetworks = networks.filter(
      (network, index, self) =>
        index === self.findIndex((n) => n.ssid === network.ssid && n.channel === network.channel),
    );

    return {
      currentNetwork,
      availableNetworks: uniqueNetworks.sort((a, b) => b.rssi - a.rssi),
    };
  } catch (error) {
    console.error("System profiler scan failed:", error);
    throw new Error(`WiFi scan failed: ${String(error)}`);
  }
}
