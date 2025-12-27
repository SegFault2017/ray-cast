// src/components/PasswordForm.tsx
import { Form, ActionPanel, Action, Icon, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { execSync } from "child_process";
import { WiFiNetwork } from "../types/wifi";

interface PasswordFormProps {
  network: WiFiNetwork;
  onConnect: (network: WiFiNetwork, password: string) => Promise<void>;
  onCancel: () => void;
}

export function PasswordForm({ network, onConnect, onCancel }: PasswordFormProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    if (!password.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Password Required",
        message: "Please enter a password",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onConnect(network, password);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchFromKeychain() {
    setIsLoading(true);
    try {
      const command = `security find-generic-password -wa ${JSON.stringify(network.ssid)}`;
      const result = execSync(command, { encoding: "utf-8" }).trim();

      // Return focus to Raycast after Keychain prompt
      try {
        execSync("open -a Raycast", { encoding: "utf-8" });
      } catch {
        // Fallback to AppleScript if open command fails
        execSync('osascript -e \'tell application "System Events" to set frontmost of process "Raycast" to true\'', {
          encoding: "utf-8",
        });
      }

      if (result) {
        setPassword(result);
        await showToast({
          style: Toast.Style.Success,
          title: "Password Retrieved",
          message: "Password fetched from Keychain",
        });
      }
    } catch {
      // Return focus to Raycast even if password fetch fails
      try {
        execSync("open -a Raycast", { encoding: "utf-8" });
      } catch {
        // Ignore errors from focus restoration
      }

      await showToast({
        style: Toast.Style.Failure,
        title: "Password Not Found",
        message: "This network's password is not saved in Keychain",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Connect" icon={Icon.Wifi} onSubmit={handleSubmit} />
          <Action
            title="Fetch from Keychain"
            icon={Icon.Key}
            onAction={fetchFromKeychain}
            shortcut={{ modifiers: ["cmd", "shift"], key: "l" }}
          />
          <Action title="Cancel" icon={Icon.XMarkCircle} onAction={onCancel} />
        </ActionPanel>
      }
    >
      <Form.Description title="Connect to WiFi Network" text={`Enter the password for "${network.ssid}"`} />
      <Form.Separator />
      <Form.Description title="Network Name" text={network.ssid} />
      <Form.Description title="Security" text={network.security} />
      <Form.Description title="Signal Strength" text={`${network.rssi} dBm`} />
      <Form.Separator />
      <Form.PasswordField
        id="password"
        title="Password"
        placeholder="Enter WiFi password"
        value={password}
        onChange={setPassword}
        autoFocus
      />
    </Form>
  );
}
