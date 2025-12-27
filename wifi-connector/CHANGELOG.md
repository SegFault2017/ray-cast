# WiFi Connector Changelog

All notable changes to the WiFi Connector extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **QR Code Sharing**: Share WiFi credentials via scannable QR codes
  - Press ⌘⇧Q to generate QR code for any network
  - Automatic password retrieval from macOS Keychain
  - Supports WPA/WPA2/WPA3, WEP, and Open networks
  - Standard WiFi QR code format for universal device compatibility
  - Copy credentials and password actions in QR view
  - QR codes generated at 300x300px with high error correction

- **UI Components**:
  - New `QRCodeView` component for displaying WiFi QR codes
  - Enhanced `PasswordForm` with Keychain fetch capability
  - Read-only network information fields in password form (SSID, Security, Signal Strength)

### Changed
- Updated password form to use read-only `Form.Description` fields for network details
- Improved focus restoration after system dialogs (Keychain prompts)
- Enhanced error messages for password retrieval failures
- Updated keyboard shortcuts to avoid Raycast reserved shortcuts
- Renamed extension from "Wifi Selector" to "Wifi Connector"
- **Security improvement**: Removed LocalStorage password storage in favor of Keychain-only approach

## [1.0.0] - Initial Release

### Added
- WiFi network scanning and display
- Connect to open and secured networks
- Password storage in Raycast LocalStorage
- Signal strength and security type indicators
- Network caching for performance (5 second cache)
- Visual indicator (key icon) for saved passwords
- Forget saved password functionality (⌘⌫)
- Copy SSID to clipboard (⌘C)
- Refresh networks action (⌘R)
- Configurable WiFi interface preference (default: en0)
- Support for both WPA/WPA2/WPA3 and open networks
- Automatic password saving after successful connection
- Network sorting by signal strength (RSSI)
- Visual indicators for connected networks
