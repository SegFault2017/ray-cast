// src/services/wifi-connector.ts
import { execSync } from "child_process";
import { WiFiNetwork } from "../types/wifi";

export interface ConnectionResult {
  success: boolean;
  message: string;
  requiresPassword?: boolean;
}

/**
 * Check if a network is open (doesn't require password)
 */
export function isOpenNetwork(network: WiFiNetwork): boolean {
  return network.security === "Open" || network.security === "OPEN" || network.security === "None";
}

/**
 * Connect to a WiFi network
 * @param network - The network to connect to
 * @param wifiInterface - The WiFi interface to use (e.g., "en0")
 * @param password - Optional password for secured networks
 */
export function connectToNetwork(network: WiFiNetwork, wifiInterface: string, password?: string): ConnectionResult {
  try {
    // Build the command based on whether password is provided
    let command: string;

    if (isOpenNetwork(network)) {
      // Open network - no password needed
      command = `/usr/sbin/networksetup -setairportnetwork ${wifiInterface} "${network.ssid}"`;
    } else if (password) {
      // Secured network with password
      // Escape password for shell
      const escapedPassword = password.replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
      command = `/usr/sbin/networksetup -setairportnetwork ${wifiInterface} "${network.ssid}" "${escapedPassword}"`;
    } else {
      // Secured network but no password provided
      return {
        success: false,
        message: "Password required for this network",
        requiresPassword: true,
      };
    }

    execSync(command, {
      timeout: 10000,
      encoding: "utf-8",
    });

    return {
      success: true,
      message: `Connected to ${network.ssid}`,
    };
  } catch (error) {
    // Parse error message to provide better feedback
    const errorMsg = String(error);

    if (errorMsg.includes("password") || errorMsg.includes("authentication")) {
      return {
        success: false,
        message: "Incorrect password or authentication failed",
      };
    }

    if (errorMsg.includes("network") || errorMsg.includes("not found")) {
      return {
        success: false,
        message: "Network not available",
      };
    }

    return {
      success: false,
      message: errorMsg,
    };
  }
}
