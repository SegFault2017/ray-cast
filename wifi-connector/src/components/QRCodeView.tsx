// src/components/QRCodeView.tsx
import { Detail, ActionPanel, Action, Icon } from "@raycast/api";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { WiFiNetwork } from "../types/wifi";

interface QRCodeViewProps {
  network: WiFiNetwork;
  password: string;
  onClose: () => void;
}

export function QRCodeView({ network, password, onClose }: QRCodeViewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateQRCode();
  }, [network, password]);

  async function generateQRCode() {
    setIsLoading(true);
    try {
      // WiFi QR code format: WIFI:T:WPA;S:SSID;P:password;H:false;;
      const securityType = getSecurityType(network.security);
      const wifiString = `WIFI:T:${securityType};S:${escapeSpecialChars(network.ssid)};P:${escapeSpecialChars(password)};H:false;;`;

      // Generate QR code as data URL
      const url = await QRCode.toDataURL(wifiString, {
        errorCorrectionLevel: "H",
        width: 300,
        margin: 2,
      });

      setQrCodeUrl(url);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function getSecurityType(security: string): string {
    const securityUpper = security.toUpperCase();
    if (securityUpper.includes("WPA") || securityUpper.includes("PSK")) {
      return "WPA";
    } else if (securityUpper.includes("WEP")) {
      return "WEP";
    } else if (securityUpper === "OPEN" || securityUpper === "NONE") {
      return "nopass";
    }
    // Default to WPA for secured networks
    return "WPA";
  }

  function escapeSpecialChars(str: string): string {
    // Escape special characters for WiFi QR code format
    return str.replace(/([\\;,":.])/g, "\\$1");
  }

  const wifiCredentials = `Network: ${network.ssid}\nPassword: ${password}\nSecurity: ${network.security}`;

  const markdown = `
# Share WiFi Network

Scan this QR code with your device to connect to **${network.ssid}**

![QR Code](${qrCodeUrl})

## Network Details
- **SSID:** ${network.ssid}
- **Security:** ${network.security}
- **Signal Strength:** ${network.rssi} dBm
- **Channel:** ${network.channel}

---
*Point your device's camera at the QR code to connect automatically*
`;

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action title="Close" icon={Icon.XMarkCircle} onAction={onClose} />
          <Action.CopyToClipboard
            title="Copy WiFi Credentials"
            content={wifiCredentials}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.CopyToClipboard
            title="Copy Password"
            content={password}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Network Name" text={network.ssid} />
          <Detail.Metadata.Label title="Security Type" text={network.security} />
          <Detail.Metadata.Label title="Signal Strength" text={`${network.rssi} dBm`} />
          <Detail.Metadata.Label title="Channel" text={`${network.channel}`} />
          {network.bssid && <Detail.Metadata.Label title="BSSID" text={network.bssid} />}
        </Detail.Metadata>
      }
    />
  );
}
