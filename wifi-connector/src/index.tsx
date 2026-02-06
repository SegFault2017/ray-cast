// src/index.tsx
import { List, ActionPanel, Action, Icon, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { WiFiNetwork, Preferences } from "./types/wifi";
import { useWiFiNetworks } from "./hooks/useWiFiNetworks";
import { connectToNetwork } from "./services/wifi-connector";
import { clearNetworksCache } from "./utils/cache";
import { getSignalIcon } from "./utils/signal";
import { PasswordForm } from "./components/PasswordForm";
import { QRCodeView } from "./components/QRCodeView";
import { fetchPasswordFromKeychain, restoreRaycastFocus } from "./utils/keychain";

export default function Command() {
  const { networks, isLoading, loadNetworks, forceRefresh } = useWiFiNetworks();
  const preferences = getPreferenceValues<Preferences>();
  const wifiInterface = preferences.wifiInterface || "en0";
  const [selectedNetwork, setSelectedNetwork] = useState<WiFiNetwork | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ network: WiFiNetwork; password: string } | null>(null);

  useEffect(() => {
    loadNetworks();
  }, [loadNetworks]);

  async function handleConnect(network: WiFiNetwork, password?: string) {
    if (!password) {
      // No password provided, show password form for secured networks
      if (network.security !== "Open" && network.security !== "OPEN") {
        setSelectedNetwork(network);
        return;
      }
    }

    await showToast({
      style: Toast.Style.Animated,
      title: `Connecting to ${network.ssid}...`,
    });

    const result = await connectToNetwork(network, wifiInterface, password);

    if (!result.success) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Connection Failed",
        message: result.message,
      });
      return;
    }

    // Connection successful
    await showToast({
      style: Toast.Style.Success,
      title: result.message,
    });

    // Clear cache and reload
    clearNetworksCache();
    await loadNetworks();

    // Close password form if it was open
    setSelectedNetwork(null);
  }

  function handleCancelPassword() {
    setSelectedNetwork(null);
  }

  async function handleShareQRCode(network: WiFiNetwork) {
    // Check if network is open (no password needed)
    if (network.security === "Open" || network.security === "OPEN") {
      setQrCodeData({ network, password: "" });
      return;
    }

    await showToast({
      style: Toast.Style.Animated,
      title: "Fetching Password",
      message: "Retrieving password from Keychain...",
    });

    // Get password from Keychain
    const password = await fetchPasswordFromKeychain(network.ssid);

    // Restore focus after Keychain prompt
    restoreRaycastFocus();

    if (!password) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Password Required",
        message: "Password not found in Keychain. Please connect to the network first to save it in Keychain.",
      });
      return;
    }

    // Successfully got password, show QR code
    await showToast({
      style: Toast.Style.Success,
      title: "QR Code Ready",
      message: "Generating QR code...",
    });

    setQrCodeData({ network, password });
  }

  function handleCloseQRCode() {
    setQrCodeData(null);
  }

  // Show QR code view if QR code data is set
  if (qrCodeData) {
    return <QRCodeView network={qrCodeData.network} password={qrCodeData.password} onClose={handleCloseQRCode} />;
  }

  // Show password form if a network is selected
  if (selectedNetwork) {
    return <PasswordForm network={selectedNetwork} onConnect={handleConnect} onCancel={handleCancelPassword} />;
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Searching WiFi Networks..." throttle>
      {networks.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.WifiDisabled}
          title="No Networks Found"
          description="Make sure WiFi is enabled and try refreshing"
        />
      ) : (
        networks.map((network) => (
          <List.Item
            key={`${network.ssid}-${network.channel}`}
            title={network.ssid}
            subtitle={network.isConnected ? "Connected" : ""}
            icon={network.isConnected ? Icon.Checkmark : Icon.Wifi}
            accessories={[
              {
                text: getSignalIcon(network.rssi),
                tooltip: `Signal: ${network.rssi} dBm`,
              },
              {
                icon: network.security !== "Open" && network.security !== "OPEN" ? Icon.Lock : undefined,
                tooltip: network.security,
              },
              {
                tag: { value: `Ch ${network.channel}`, color: "#888888" },
              },
            ]}
            actions={
              <ActionPanel>
                <Action title="Connect" icon={Icon.Wifi} onAction={() => handleConnect(network)} />
                <Action
                  title="Share Via QR Code"
                  icon={Icon.Camera}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "q" }}
                  onAction={() => handleShareQRCode(network)}
                />
                <Action
                  title="Refresh Networks"
                  icon={Icon.ArrowClockwise}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                  onAction={forceRefresh}
                />
                <Action.CopyToClipboard
                  title="Copy SSID"
                  content={network.ssid}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
