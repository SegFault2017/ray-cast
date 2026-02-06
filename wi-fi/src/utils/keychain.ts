// src/utils/keychain.ts
import { execSync } from "child_process";

/**
 * Fetch WiFi password from macOS Keychain
 * @param ssid - Network SSID
 * @returns Password if found, null if not found or error
 */
export async function fetchPasswordFromKeychain(ssid: string): Promise<string | null> {
  try {
    const command = `security find-generic-password -wa ${JSON.stringify(ssid)}`;
    const result = execSync(command, { encoding: "utf-8" }).trim();
    return result || null;
  } catch {
    // Password not found in Keychain or user cancelled authentication
    return null;
  }
}

/**
 * Attempt to restore focus to Raycast after Keychain prompt
 */
export function restoreRaycastFocus(): void {
  try {
    execSync("open -a Raycast", { encoding: "utf-8" });
  } catch {
    // Fallback to AppleScript if open command fails
    try {
      execSync('osascript -e \'tell application "System Events" to set frontmost of process "Raycast" to true\'', {
        encoding: "utf-8",
      });
    } catch {
      // Ignore errors from focus restoration
    }
  }
}
